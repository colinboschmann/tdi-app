// Accountability Mode Test Suite
// Tests for TDI.jsx accountability feature on https://tdi-app.netlify.app
//
// TEST PLAN
// ─────────────────────────────────────────────────────────────
// Group A — UI structure (does the DOM look right?)
//   A1. Accountability label appears on every goal card
//   A2. Toggle starts in OFF state (no time input visible)
//   A3. Clicking the toggle enables accountability (visual state flips)
//   A4. Enabling accountability reveals a time input
//   A5. Time input defaults to 20:00
//   A6. Clicking the toggle a second time disables accountability (time input hides)
//
// Group B — Data persistence (does it write to localStorage correctly?)
//   B1. Enabling toggle sets accountability.enabled=true in localStorage
//   B2. Default time stored as "20:00"
//   B3. Changing the time input updates accountability.time in localStorage
//   B4. Due date is preserved alongside accountability settings
//
// Group C — Notification scheduler (does the check() interval fire the right way?)
//   C1. At the accountability time, a Notification is constructed with a
//       goal-specific message containing the goal title
//   C2. When the goal has a due date, the notification body includes it
//   C3. When a notification for today already exists, no duplicate is sent
//   C4. Notification does NOT fire when time hasn't been reached yet
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

const URL = 'https://tdi-app.netlify.app';

// Minimal valid data structure matching mkData() shape
function makeData(goals = [], extraNotifs = []) {
  return {
    health: {
      stepGoal: 10000,
      steps: [{ date: 'May 11', count: 3000 }],
      calorieGoal: 2000, foodLog: [], waterGoal: 8, waterCount: 0,
    },
    tasks: [], notes: [],
    goals,
    events: [], habits: [], journal: [],
    notifSettings: {
      events: true, habits: true, steps: false, goals: true,
      news: false, stocks: false, favSources: [], favSymbols: [],
      stepReminderTime: '21:00',
    },
    notifications: extraNotifs,
    finance: { monthlyIncome: 0, categories: [], savingsGoals: [], transactions: [] },
  };
}

function makeGoal(overrides = {}) {
  return {
    id: 1715000000001,
    title: 'Launch MVP',
    category: 'Business',
    due: 'Jun 1',
    progress: 30,
    accountability: { enabled: false, time: '20:00' },
    ...overrides,
  };
}

// Boot the app with pre-seeded localStorage; returns after boot animation clears.
// The Boot overlay uses pointer-events:none so clicks pass through, but we wait
// for the overlay to fade (~3.4 s) before asserting visibility.
async function bootApp(page, data = makeData()) {
  await page.addInitScript((serialised) => {
    localStorage.setItem('tdi_onboarded', 'true');
    localStorage.setItem('tdi_data', JSON.stringify(serialised));
  }, data);
  await page.goto(URL, { waitUntil: 'load' });
  // Wait for boot animation to finish (setBooting(false) fires at 3200 ms)
  await page.waitForTimeout(4000);
}

// Open the nav sheet and tap the Goals tile.
async function goToGoals(page) {
  await page.locator('.navpill').click();
  await page.waitForTimeout(300);
  // Goals tile — icon ◎ plus label "Goals"
  const goalsTile = page.locator('span', { hasText: 'Goals' }).last();
  await goalsTile.click();
  await page.waitForTimeout(400);
}

// Click the accountability toggle on the last goal card using the DOM structure:
//   span"Accountability" → parent left-group div → parent row div → lastElementChild (toggle)
async function clickToggle(page) {
  await page.evaluate(() => {
    const spans = [...document.querySelectorAll('span')];
    const label = spans.filter(s => s.textContent.trim() === 'Accountability').pop();
    if (!label) throw new Error('Accountability label not found');
    const row = label.parentElement.parentElement;
    row.lastElementChild.click();
  });
  await page.waitForTimeout(200);
}

// ── Group A: UI structure ─────────────────────────────────────

test('A1 — accountability label appears on every goal card', async ({ page }) => {
  await bootApp(page, makeData([makeGoal()]));
  await goToGoals(page);

  const label = page.locator('span', { hasText: 'Accountability' });
  await expect(label).toBeVisible();
});

test('A2 — toggle starts OFF; no time input visible', async ({ page }) => {
  await bootApp(page, makeData([makeGoal({ accountability: { enabled: false, time: '20:00' } })]));
  await goToGoals(page);

  await expect(page.locator('input[type="time"]')).not.toBeVisible();
});

test('A3 — clicking toggle flips visual state to ON (orange background)', async ({ page }) => {
  await bootApp(page, makeData([makeGoal()]));
  await goToGoals(page);

  // Capture the toggle div's background-color before and after click
  const bgBefore = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('span')];
    const label = spans.filter(s => s.textContent.trim() === 'Accountability').pop();
    const toggle = label.parentElement.parentElement.lastElementChild;
    return getComputedStyle(toggle).backgroundColor;
  });

  await clickToggle(page);

  const bgAfter = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('span')];
    const label = spans.filter(s => s.textContent.trim() === 'Accountability').pop();
    const toggle = label.parentElement.parentElement.lastElementChild;
    return getComputedStyle(toggle).backgroundColor;
  });

  // OFF → some dark/neutral color; ON → accent orange (rgb 232,135,90)
  expect(bgBefore).not.toBe(bgAfter);
  expect(bgAfter).toContain('232'); // accent orange contains 232
});

test('A4 — enabling toggle reveals time input', async ({ page }) => {
  await bootApp(page, makeData([makeGoal()]));
  await goToGoals(page);

  await expect(page.locator('input[type="time"]')).not.toBeVisible();
  await clickToggle(page);
  await expect(page.locator('input[type="time"]')).toBeVisible();
});

test('A5 — time input defaults to 20:00', async ({ page }) => {
  await bootApp(page, makeData([makeGoal()]));
  await goToGoals(page);
  await clickToggle(page);

  await expect(page.locator('input[type="time"]')).toHaveValue('20:00');
});

test('A6 — toggling OFF again hides the time input', async ({ page }) => {
  await bootApp(page, makeData([makeGoal()]));
  await goToGoals(page);

  await clickToggle(page); // → ON
  await expect(page.locator('input[type="time"]')).toBeVisible();

  await clickToggle(page); // → OFF
  await expect(page.locator('input[type="time"]')).not.toBeVisible();
});

// ── Group B: Data persistence ─────────────────────────────────

test('B1 — enabling toggle writes accountability.enabled=true to localStorage', async ({ page }) => {
  await bootApp(page, makeData([makeGoal()]));
  await goToGoals(page);
  await clickToggle(page);

  const stored = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('tdi_data'));
    return d.goals[0].accountability;
  });
  expect(stored.enabled).toBe(true);
});

test('B2 — default time stored as "20:00"', async ({ page }) => {
  await bootApp(page, makeData([makeGoal()]));
  await goToGoals(page);
  await clickToggle(page);

  const stored = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('tdi_data'));
    return d.goals[0].accountability.time;
  });
  expect(stored).toBe('20:00');
});

test('B3 — changing time input updates accountability.time in localStorage', async ({ page }) => {
  await bootApp(page, makeData([makeGoal()]));
  await goToGoals(page);
  await clickToggle(page);

  await page.locator('input[type="time"]').fill('09:30');
  await page.waitForTimeout(200);

  const stored = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('tdi_data'));
    return d.goals[0].accountability.time;
  });
  expect(stored).toBe('09:30');
});

test('B4 — due date is preserved alongside accountability settings', async ({ page }) => {
  const goal = makeGoal({ due: 'Jun 1', accountability: { enabled: false, time: '20:00' } });
  await bootApp(page, makeData([goal]));
  await goToGoals(page);
  await clickToggle(page);

  const stored = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('tdi_data'));
    return d.goals[0];
  });
  expect(stored.due).toBe('Jun 1');
  expect(stored.accountability.enabled).toBe(true);
});

// ── Group C: Notification scheduler ──────────────────────────
// Uses page.clock to fake time so we can advance past the 60-second setInterval
// without actually waiting 60 seconds.
//
// Clock starts at 19:59:00.  The check() interval is registered for +60 000 ms
// (fires at 20:00:00).  runFor(65 000) advances the fake clock past that point.

async function bootWithFakeClock(page, clockTime, data) {
  // Install fake clock BEFORE page.goto so setTimeout/setInterval are patched
  await page.clock.install({ time: new Date(clockTime).getTime() });

  await page.addInitScript((serialised) => {
    // Capture Notification constructor calls before React replaces anything
    window.__notifsCaptured = [];
    const _Notif = window.Notification;
    window.Notification = function(title, opts) {
      window.__notifsCaptured.push({ title, body: opts && opts.body });
      try { return new _Notif(title, opts); } catch (_) {}
    };
    Object.defineProperty(window.Notification, 'permission', { get: () => 'granted', configurable: true });
    window.Notification.requestPermission = () => Promise.resolve('granted');

    localStorage.setItem('tdi_onboarded', 'true');
    localStorage.setItem('tdi_data', JSON.stringify(serialised));
  }, data);

  await page.goto(URL, { waitUntil: 'load' });

  // React schedules useEffects via MessageChannel (real time, not fake clock).
  // The setInterval(check, 60000) is registered inside useEffect. We must wait
  // in real time for that to happen BEFORE advancing the fake clock, otherwise
  // runFor() ticks through 65 s before the interval even exists.
  await page.waitForTimeout(1200);

  // Advance fake clock: 19:59:00 → 20:00:05 — triggers the 60-second interval.
  await page.clock.runFor(65000);

  // React batches the setData() call from check(). Wait in real time for React
  // to flush the state update (which calls fireWebNotif and saves localStorage).
  await page.waitForTimeout(1500);
}

test('C1 — accountability notification saved to data.notifications at check time', async ({ page }) => {
  const goal = makeGoal({ accountability: { enabled: true, time: '20:00' } });
  await bootWithFakeClock(page, '2026-05-11T19:59:00', makeData([goal]));

  // check() writes the notification into React state → saved to localStorage
  const storedNotifs = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('tdi_data') || '{}');
    return d.notifications || [];
  });
  const hit = storedNotifs.find(n => n.type === 'accountability');

  expect(hit).toBeTruthy();
  expect(hit.title).toContain('Check-in');
  expect(hit.title).toContain('Launch MVP');
  expect(hit.body).toContain('what did you do toward that today');
  expect(hit.date).toBe('2026-05-11');
});

test('C2 — notification body includes goal title and due date', async ({ page }) => {
  const goal = makeGoal({ title: 'Ship the redesign', due: 'Jul 15', accountability: { enabled: true, time: '20:00' } });
  await bootWithFakeClock(page, '2026-05-11T19:59:00', makeData([goal]));

  const storedNotifs = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('tdi_data') || '{}');
    return d.notifications || [];
  });
  const hit = storedNotifs.find(n => n.type === 'accountability');

  expect(hit).toBeTruthy();
  expect(hit.body).toContain('Ship the redesign');
  expect(hit.body).toContain('Jul 15');
  expect(hit.body).toContain('what did you do toward that today');
});

test('C3 — no duplicate notification when one already exists for today', async ({ page }) => {
  const todayStr = '2026-05-11';
  const existingNotif = {
    id: 1,
    type: 'accountability',
    icon: '◎',
    title: 'Check-in: Launch MVP',
    body: 'You said you wanted to Launch MVP by Jun 1 — what did you do toward that today?',
    time: '8:00 PM',
    date: todayStr,
    read: false,
  };
  const goal = makeGoal({ accountability: { enabled: true, time: '20:00' } });
  const data = makeData([goal], [existingNotif]);

  await bootWithFakeClock(page, '2026-05-11T19:59:00', data);

  const notifs = await page.evaluate(() => window.__notifsCaptured || []);
  const hits = notifs.filter(n => n.title && n.title.includes('Check-in: Launch MVP'));

  // Must be zero — the existing notification for today blocks re-firing
  expect(hits.length).toBe(0);
});

test('C4 — notification does NOT fire when time has not been reached', async ({ page }) => {
  // Goal accountability at 20:00 but clock only advances to 19:00
  const goal = makeGoal({ accountability: { enabled: true, time: '20:00' } });

  await page.clock.install({ time: new Date('2026-05-11T18:59:00').getTime() });
  await page.addInitScript((serialised) => {
    window.__notifsCaptured = [];
    const _Notif = window.Notification;
    window.Notification = function(title, opts) {
      window.__notifsCaptured.push({ title, body: opts && opts.body });
      try { return new _Notif(title, opts); } catch (_) {}
    };
    Object.defineProperty(window.Notification, 'permission', { get: () => 'granted', configurable: true });
    window.Notification.requestPermission = () => Promise.resolve('granted');
    localStorage.setItem('tdi_onboarded', 'true');
    localStorage.setItem('tdi_data', JSON.stringify(serialised));
  }, makeData([goal]));

  await page.goto(URL, { waitUntil: 'load' });
  // Advance 65 s from 18:59 → reaches 19:00:05, nowhere near 20:00
  await page.clock.runFor(65000);
  await page.waitForTimeout(600);

  const notifs = await page.evaluate(() => window.__notifsCaptured || []);
  const hits = notifs.filter(n => n.title && n.title.includes('Check-in'));
  expect(hits.length).toBe(0);
});
