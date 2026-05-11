const { useState, useEffect, useRef, useCallback } = React;
const T = {
bg:"#1A1A1B", surface1:"#222224", surface2:"#2A2A2C", surface3:"#323235",
border:"#333336", border2:"#3E3E42",
accent:"#E8875A", accentDim:"rgba(232,135,90,0.15)",
text1:"#F2F2F3", text2:"#A8A8AE", text3:"#606066",
};
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const P_C={high:T.accent,medium:T.text2,low:T.text3};
const TAG_C={Work:T.accent,Personal:T.text2,Health:T.accent,School:T.text2};
const CAT_C={Business:T.accent,Learning:T.text2,Health:T.accent,Personal:T.text2};
const MOODS=[
{key:"terrible",icon:"▼",label:"Terrible",color:"#E05C5C"},
{key:"bad",     icon:"◁",label:"Bad",     color:"#E08A4A"},
{key:"okay",    icon:"◈",label:"Okay",    color:"#A8A8AE"},
{key:"good",    icon:"▷",label:"Good",    color:"#5AC47B"},
{key:"great",   icon:"▲",label:"Great",   color:"#E8875A"},
];

const W=(id,size,visible)=>({id,size,visible});

// Style aliases — reduce repetition
const FI="inherit";// fontFamily inherit
const LS="-.01em";// letterSpacing
const DF="flex";// display flex
const AC="center";// alignItems center
const CP="pointer";// cursor pointer

const mkData=()=>({
health:{stepGoal:10000,steps:[
{date:"May 3",count:0},{date:"May 4",count:0},{date:"May 5",count:0},{date:"May 6",count:0},{date:"May 7",count:0},{date:"May 8",count:0},{date:"May 9",count:0},
],calorieGoal:2000,foodLog:[],waterGoal:8,waterCount:0},
tasks:[],
notes:[],
goals:[],
events:[],
habits:[],
journal:[],
notifSettings:{events:true,habits:true,steps:true,goals:true,news:false,stocks:false,favSources:[],favSymbols:[],stepReminderTime:"20:00"},
notifications:[],
finance:{monthlyIncome:0,categories:[],savingsGoals:[],transactions:[]},
});
const WIDGET_DEFS={
steps:{label:"Steps",icon:"◈",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Number + bar"},
{key:"large",label:"Large",span:2,rows:1,desc:"Number + 7-day chart"},
]},
calories:{label:"Calories",icon:"◉",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Number + bar"},
{key:"large",label:"Large",span:2,rows:1,desc:"Number + meal breakdown"},
]},
tasks:{label:"Tasks",icon:"✓",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Count + 1 task"},
{key:"medium",label:"Medium",span:2,rows:1,desc:"Top 3 tasks"},
{key:"large",label:"Large",span:2,rows:2,desc:"Top 5 tasks + tags"},
]},
calendar:{label:"Calendar",icon:"▦",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Today's events"},
{key:"medium",label:"Medium",span:2,rows:1,desc:"Next 3 events"},
{key:"large",label:"Large",span:2,rows:2,desc:"Month grid + events"},
]},
goals:{label:"Goals",icon:"◎",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Progress ring"},
{key:"large",label:"Large",span:2,rows:2,desc:"All goals + bars"},
]},
habits:{label:"Habits",icon:"◇",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Streak count"},
{key:"large",label:"Large",span:2,rows:1,desc:"All habits today"},
]},
finance:{label:"Finance",icon:"$",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Budget overview"},
{key:"large",label:"Large",span:2,rows:1,desc:"Spending + savings"},
]},
journal:{label:"Journal",icon:"✎",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Streak + prompt"},
{key:"large",label:"Large",span:2,rows:1,desc:"Today's entry preview"},
]},
focus:{label:"Focus",icon:"◉",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Sessions today"},
{key:"large",label:"Large",span:2,rows:1,desc:"Timer + sessions"},
]},
news:{label:"News",icon:"▤",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Top headline"},
{key:"large",label:"Large",span:2,rows:2,desc:"Top 4 headlines"},
]},
stocks:{label:"Markets",icon:"◸",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Market summary"},
{key:"large",label:"Large",span:2,rows:1,desc:"Key indices + movers"},
]},
notes:{label:"Notes",icon:"✐",sizes:[
{key:"small",label:"Small",span:1,rows:1,desc:"Note count"},
{key:"medium",label:"Medium",span:2,rows:1,desc:"Recent 2 notes"},
]},
};

const DEFAULT_LAYOUT=[
{id:"steps", size:"small", visible:false},
{id:"calories", size:"small", visible:false},
{id:"tasks", size:"medium", visible:true},
{id:"calendar", size:"medium", visible:true},
{id:"habits", size:"small", visible:true},
{id:"finance", size:"small", visible:true},
{id:"news", size:"large", visible:true},
{id:"goals", size:"large", visible:true},
{id:"journal", size:"small", visible:false},
{id:"focus", size:"small", visible:false},
{id:"stocks", size:"large", visible:false},
{id:"notes", size:"small", visible:false},
];
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0;}
body{background:${T.bg};font-family:'Geist',sans-serif;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{display:none;}
::placeholder{color:${T.text3};}
input[type=range]{accent-color:${T.accent};}
input[type=date]{color-scheme:dark;}
textarea{font-family:'Geist',sans-serif;}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes dotPulse{0%,80%,100%{transform:scale(.8);opacity:.4}40%{transform:scale(1);opacity:1}}
@keyframes bootFade{0%{opacity:0;transform:scale(.94)}60%{transform:scale(1.01)}100%{opacity:1;transform:scale(1)}}
@keyframes bootSub{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes timerPulse{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.page{animation:fadeUp .3s cubic-bezier(.16,1,.3,1) both;}
.scaleIn{animation:scaleIn .22s cubic-bezier(.16,1,.3,1) both;}
.slideUp{animation:slideUp .34s cubic-bezier(.16,1,.3,1) both;}
.fadeIn{animation:fadeIn .2s ease both;}

.card{background:${T.surface2};border:1px solid ${T.border};border-radius:18px;}
.inp{width:100%;background:${T.surface3};border:1px solid ${T.border2};border-radius:12px;padding:12px 15px;font-size:15px;font-family:'Geist',sans-serif;color:${T.text1};outline:none;transition:border-color .18s;letter-spacing:-.01em;}
.inp:focus{border-color:${T.accent};}
.btn-p{background:${T.accent};color:#fff;border:none;border-radius:12px;font-family:'Geist',sans-serif;font-weight:700;font-size:14px;letter-spacing:-.01em;padding:13px 22px;cursor:pointer;transition:opacity .15s,transform .1s;}
.btn-p:active{opacity:.85;transform:scale(.98);}
.btn-s{background:${T.surface3};color:${T.text2};border:1px solid ${T.border2};border-radius:12px;font-family:'Geist',sans-serif;font-weight:600;font-size:14px;letter-spacing:-.01em;padding:13px 20px;cursor:pointer;transition:background .15s;}
.btn-s:active{background:${T.border};}
.seg{display:flex;gap:3px;background:${T.surface1};border-radius:11px;padding:3px;}
.seg-b{flex:1;padding:8px 0;border:none;border-radius:9px;cursor:pointer;font-family:'Geist',sans-serif;font-weight:600;font-size:13px;letter-spacing:-.01em;transition:all .15s;}
.seg-on{background:${T.surface3};color:${T.text1};}
.seg-off{background:transparent;color:${T.text3};}
.chip{display:inline-flex;align-items:center;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:-.01em;border:1px solid ${T.border2};cursor:pointer;transition:all .15s;font-family:'Geist',sans-serif;background:${T.surface3};color:${T.text3};}
.back{display:inline-flex;align-items:center;gap:5px;font-size:14px;font-weight:600;color:${T.text3};background:none;border:none;cursor:pointer;font-family:'Geist',sans-serif;letter-spacing:-.01em;padding:0;margin-bottom:24px;transition:color .15s;}
.back:active{color:${T.text1};}
.pbar{height:3px;background:${T.surface3};border-radius:3px;overflow:hidden;}
.pfill{height:100%;border-radius:3px;transition:width .5s cubic-bezier(.16,1,.3,1);}
.icon-btn{display:flex;align-items:center;justify-content:center;background:${T.surface3};border:1px solid ${T.border2};border-radius:12px;cursor:pointer;transition:background .15s;color:${T.text2};font-family:'Geist',sans-serif;}
.icon-btn:active{background:${T.border};}
.chk{width:22px;height:22px;border-radius:50%;border:1.5px solid ${T.border2};background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:all .15s;}
.chk.done{background:${T.accent};border-color:${T.accent};}
.navpill{background:${T.surface2};border:1px solid ${T.border2};border-radius:100px;box-shadow:0 8px 32px rgba(0,0,0,.4),0 1px 0 rgba(255,255,255,.04) inset;}
.sheet{background:${T.surface1};border-top:1px solid ${T.border2};border-radius:24px 24px 0 0;}
.tappable{transition:opacity .1s;}
.tappable:active{opacity:.65;}
.no-select{-webkit-user-select:none;user-select:none;}
.nav-sheet{touch-action:none;}
.d1{animation:dotPulse 1.2s .0s ease-in-out infinite;}
.d2{animation:dotPulse 1.2s .2s ease-in-out infinite;}
.d3{animation:dotPulse 1.2s .4s ease-in-out infinite;}
`;
const R=(jc="flex-start",gap=10)=>({display:DF,alignItems:AC,justifyContent:jc,gap});
const fmt=(s)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
function Boot({phase}){
return(
<div style={{position:"fixed",inset:0,background:T.bg,display:DF,flexDirection:"column",alignItems:AC,justifyContent:"center",zIndex:9999,opacity:phase>=2?0:1,transition:"opacity .8s cubic-bezier(.4,0,.2,1)",pointerEvents:"none"}}>
<div style={{animation:phase>=1?"bootFade .9s cubic-bezier(.16,1,.3,1) forwards":"none",opacity:phase>=1?undefined:0,textAlign:"center"}}>
<div style={{fontSize:72,fontWeight:800,color:T.text1,letterSpacing:"-.05em",fontFamily:"'Geist',sans-serif",lineHeight:1}}>TDI</div>
<div style={{fontSize:11,color:T.accent,marginTop:10,letterSpacing:".2em",fontFamily:"'Geist',sans-serif",fontWeight:600,animation:phase>=1?"bootSub .6s .5s ease both":"none"}}>THEN DO IT</div>
</div>
<style>{`@keyframes bootFade{0%{opacity:0;transform:scale(.94)}60%{transform:scale(1.01)}100%{opacity:1;transform:scale(1)}} @keyframes bootSub{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
</div>
);
}
 function App(){
const [bootPhase,setBootPhase]=useState(0);
const [booting,setBooting]=useState(true);
const [onboarded,setOnboarded]=useState(()=>localStorage.getItem("tdi_onboarded")==="true");
const [view,setView]=useState("home");
const [data,setData]=useState(()=>{try{const s=localStorage.getItem("tdi_data");return s?JSON.parse(s):mkData();}catch{return mkData();}});
const [navOpen,setNavOpen]=useState(false);
const [aiOpen,setAiOpen]=useState(false);
const [notifOpen,setNotifOpen]=useState(false);
const [brainDump,setBrainDump]=useState(false);
const [weeklyReview,setWeeklyReview]=useState(false);
const [weeklyWrapped,setWeeklyWrapped]=useState(false);
const [layout,setLayout]=useState(()=>{try{const s=localStorage.getItem("tdi_layout");return s?JSON.parse(s):DEFAULT_LAYOUT;}catch{return DEFAULT_LAYOUT;}});
const [news,setNews]=useState([]);
const [stocks,setStocks]=useState([]);
const [liveLoaded,setLiveLoaded]=useState(false);
const screenRef=useRef(null);
const touchStartY=useRef(0);
const touchStartX=useRef(0);
useEffect(()=>{try{localStorage.setItem("tdi_data",JSON.stringify(data));}catch{}},[data]);
useEffect(()=>{try{localStorage.setItem("tdi_layout",JSON.stringify(layout));}catch{}},[layout]);
const touchX=useRef(null);
const stepRef=useRef(null);
const lastPeak=useRef(0);
const stepBuf=useRef([]);

useEffect(()=>{
const t1=setTimeout(()=>setBootPhase(1),200);
const t2=setTimeout(()=>setBootPhase(2),2400);
const t3=setTimeout(()=>setBooting(false),3200);
return()=>[t1,t2,t3].forEach(clearTimeout);
},[]);

useEffect(()=>{
const start=async()=>{
if(typeof DeviceMotionEvent==="undefined")return;
if(typeof DeviceMotionEvent.requestPermission==="function"){
try{const p=await DeviceMotionEvent.requestPermission();if(p!=="granted")return;}catch{return;}
}
const h=e=>{
const a=e.accelerationIncludingGravity;if(!a)return;
const mag=Math.sqrt((a.x||0)**2+(a.y||0)**2+(a.z||0)**2);
stepBuf.current.push(mag);if(stepBuf.current.length>6)stepBuf.current.shift();
const avg=stepBuf.current.reduce((x,y)=>x+y,0)/stepBuf.current.length;
const now=Date.now();
if(mag>avg+11&&now-lastPeak.current>380){
lastPeak.current=now;
setData(d=>{const s=[...d.health.steps];s[s.length-1]={...s[s.length-1],count:s[s.length-1].count+1};return{...d,health:{...d.health,steps:s}};});
}
};
window.addEventListener("devicemotion",h);stepRef.current=h;
};
start();
return()=>{if(stepRef.current)window.removeEventListener("devicemotion",stepRef.current);};
},[]);

useEffect(()=>{
const el=screenRef.current;if(!el)return;
const ts=e=>{touchX.current=e.touches[0].clientX<32?e.touches[0].clientX:null;};
const te=e=>{if(touchX.current!==null&&e.changedTouches[0].clientX-touchX.current>55){setView("home");setNavOpen(false);}touchX.current=null;};
el.addEventListener("touchstart",ts,{passive:true});
el.addEventListener("touchend",te,{passive:true});
return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchend",te);};
},[]);
useEffect(()=>{
if(booting||liveLoaded)return;
setLiveLoaded(true);
const fetchLive=async()=>{
try{
const res=await fetch("/api/claude",{
method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({
model:"claude-sonnet-4-6",max_tokens:800,
tools:[{type:"web_search_20250305",name:"web_search"}],
messages:[{role:"user",content:"Search for today's top 4 US news headlines and current stock prices for S&P 500, Nasdaq, Dow Jones, Bitcoin, and Apple (AAPL). Return ONLY valid JSON with no markdown:\n{\"news\":[{\"headline\":\"...\",\"source\":\"...\",\"category\":\"...\"}],\"stocks\":[{\"symbol\":\"...\",\"name\":\"...\",\"price\":\"...\",\"change\":\"+/-X.XX%\"}]}"}]
})
});
const result=await res.json();
const textBlock=result.content?.find(b=>b.type==="text");
if(textBlock?.text){
const clean=textBlock.text.replace(/```json|```/g,"").trim();
const start=clean.indexOf("{");const end=clean.lastIndexOf("}")+1;
if(start>=0&&end>start){
const parsed=JSON.parse(clean.slice(start,end));
if(parsed.news?.length)setNews(parsed.news.slice(0,4));
if(parsed.stocks?.length)setStocks(parsed.stocks.slice(0,5));
}
}
}catch(e){
setNews([
{headline:"Fed holds interest rates steady amid inflation concerns",source:"Reuters",category:"Economy"},
{headline:"Tech stocks rally as AI spending outlook improves",source:"WSJ",category:"Markets"},
{headline:"Senate passes new infrastructure spending bill",source:"AP",category:"Politics"},
{headline:"SpaceX launches next-gen Starlink satellites",source:"Bloomberg",category:"Tech"},
]);
setStocks([
{symbol:"SPY",name:"S&P 500",price:"5,842",change:"+0.42%"},
{symbol:"QQQ",name:"Nasdaq",price:"18,230",change:"+0.68%"},
{symbol:"DOW",name:"Dow Jones",price:"43,100",change:"+0.21%"},
{symbol:"BTC",name:"Bitcoin",price:"$62,400",change:"-1.2%"},
{symbol:"AAPL",name:"Apple",price:"$189.30",change:"+0.55%"},
]);
}
};
fetchLive();
},[booting,liveLoaded]);

const go=useCallback((v)=>{setView(v);setNavOpen(false);},[]);
useEffect(()=>{
if(!booting&&"Notification" in window&&Notification.permission==="default"){
Notification.requestPermission();
}
},[booting]);
useEffect(()=>{
const fireWebNotif=(title,body,icon="◈")=>{
if("Notification" in window&&Notification.permission==="granted"){
new Notification(`TDI — ${title}`,{body,icon:"/favicon.ico",tag:title});
}
};
const addNotif=(notif)=>{
setData(d=>{
const already=d.notifications.some(n=>n.title===notif.title&&n.time===notif.time);
if(already)return d;
fireWebNotif(notif.title,notif.body);
return{...d,notifications:[{...notif,id:Date.now(),read:false},...d.notifications].slice(0,50)};
});
};
const check=()=>{
const now=new Date();
const hhmm=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
const timeStr=now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
const todayStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
setData(d=>{
const ns=d.notifSettings;
const notifs=[];
if(ns.habits){
d.habits.forEach(h=>{
if(h.notifTime===hhmm){
const done=h.completedDates.includes(todayStr);
if(!done){
const streak=(()=>{let s=0;const dd=new Date(now);dd.setDate(dd.getDate()-1);while(s<100){const ds=`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;if(!h.completedDates.includes(ds))break;s++;dd.setDate(dd.getDate()-1);}return s;})();
notifs.push({type:"habit",icon:h.icon,title:`${h.name}`,body:streak>0?`Don't break your ${streak}-day streak!`:"Time to build the habit.",time:timeStr});
}
}
});
}
if(ns.events){
d.events.forEach(ev=>{
if(ev.date!==todayStr||!ev.time)return;
try{
const [t,ampm]=ev.time.split(" ");
const [h2,m2]=t.split(":").map(Number);
const evH=(ampm==="PM"&&h2!==12)?h2+12:(ampm==="AM"&&h2===12)?0:h2;
const evMins=evH*60+m2;
const nowMins=now.getHours()*60+now.getMinutes();
if(evMins-nowMins===60){
notifs.push({type:"event",icon:"▦",title:ev.title,body:`Starting in 1 hour — ${ev.time}`,time:timeStr});
}
if(now.getHours()===8&&now.getMinutes()===0){
notifs.push({type:"event",icon:"▦",title:`Today: ${ev.title}`,body:`Scheduled for ${ev.time}`,time:timeStr});
}
}catch{}
});
}
if(ns.steps&&hhmm===ns.stepReminderTime){
const todaySteps=d.health.steps[d.health.steps.length-1]?.count||0;
const pct=Math.round((todaySteps/d.health.stepGoal)*100);
if(pct<80){
notifs.push({type:"steps",icon:"◈",title:"Step goal check-in",body:`You're at ${todaySteps.toLocaleString()} steps — ${100-pct}% left to hit your goal.`,time:timeStr});
}else if(pct>=100){
notifs.push({type:"steps",icon:"◈",title:"Step goal reached",body:`${todaySteps.toLocaleString()} steps — goal complete.`,time:timeStr});
}
}
if(ns.goals){
d.goals.forEach(g=>{
if(g.progress===100){
const alreadyCelebrated=d.notifications.some(n=>n.type==="goal_complete"&&n.body?.includes(g.title));
if(!alreadyCelebrated){
notifs.push({type:"goal_complete",icon:"◎",title:"Goal complete",body:`You finished "${g.title}" — well done.`,time:timeStr});
}
}
});
}

d.goals.forEach(g=>{
if(!g.accountability?.enabled)return;
const acctTime=g.accountability?.time||"20:00";
if(hhmm!==acctTime)return;
const dueText=g.due?` by ${g.due}`:"";
const body=`You said you wanted to ${g.title}${dueText} — what did you do toward that today?`;
const alreadySent=d.notifications.some(n=>n.type==="accountability"&&n.title===`Check-in: ${g.title}`&&n.date===todayStr);
if(!alreadySent)notifs.push({type:"accountability",icon:"◎",title:`Check-in: ${g.title}`,body,time:timeStr,date:todayStr});
});

if(notifs.length===0)return d;
notifs.forEach(n=>{fireWebNotif(n.title,n.body);});
const newNotifs=notifs.filter(n=>
n.type==="accountability"
?!d.notifications.some(ex=>ex.type==="accountability"&&ex.title===n.title&&ex.date===n.date)
:!d.notifications.some(ex=>ex.title===n.title&&ex.time===n.time)
);
return{...d,notifications:[...newNotifs.map(n=>({...n,id:Date.now()+Math.random(),read:false})),...d.notifications].slice(0,50)};
});
};
const iv=setInterval(check,60000);
return()=>clearInterval(iv);
},[]);

return(
<React.Fragment>
<style>{CSS}</style>
{booting&&<Boot phase={bootPhase}/>}
<div style={{minHeight:"100svh",background:T.bg,display:DF,alignItems:AC,justifyContent:"center"}}>
<div ref={screenRef} onTouchStart={e=>{touchStartY.current=e.touches[0].clientY;touchStartX.current=e.touches[0].clientX;}} onTouchEnd={e=>{const dy=e.changedTouches[0].clientY-touchStartY.current;const dx=e.changedTouches[0].clientX-touchStartX.current;if(dx>80&&Math.abs(dy)<60&&view!=="home"){setView("home");}}} style={{width:"100%",maxWidth:430,height:"100svh",background:T.bg,display:DF,flexDirection:"column",position:"relative",overflow:"hidden",fontFamily:"'Geist',sans-serif",color:T.text1}}>
{!booting&&!onboarded&&(
<Onboarding onComplete={(selectedLayout)=>{setLayout(selectedLayout);localStorage.setItem("tdi_onboarded","true");setOnboarded(true);}}/>
)}
{(booting||onboarded)&&(
<React.Fragment>
<div style={{...R("space-between"),padding:"calc(12px + env(safe-area-inset-top)) 22px 0",flexShrink:0}}>
<span style={{fontSize:14,fontWeight:800,letterSpacing:"-.03em",color:T.text1}}>TDI</span>
<div style={{...R(),gap:12}}>
<div onClick={()=>setNotifOpen(v=>!v)} style={{position:"relative",cursor:CP,display:DF,alignItems:AC,justifyContent:"center",width:28,height:28}}>
<span style={{fontSize:16,color:notifOpen?T.accent:T.text3,transition:"color .15s",fontWeight:300}}>◬</span>
{data.notifications.filter(n=>!n.read).length>0&&(
<div style={{position:"absolute",top:-2,right:-2,width:16,height:16,borderRadius:"50%",background:T.accent,display:DF,alignItems:AC,justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",border:`2px solid ${T.bg}`}}>
{Math.min(data.notifications.filter(n=>!n.read).length,9)}
</div>
)}
</div>
</div>
</div>
<div style={{flex:1,overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch"}}>
<div style={{padding:"0 16px 32px"}}>
{view==="home"&&<HomeScreen data={data} layout={layout} go={go} setAiOpen={setAiOpen} news={news} stocks={stocks} setBrainDump={setBrainDump} setWeeklyReview={setWeeklyReview} setWeeklyWrapped={setWeeklyWrapped}/>}
{view!=="home"&&(
<div style={{paddingTop:16}}>
<button className="back" onClick={()=>go("home")}>‹ Home</button>
{view==="tasks" &&<TasksScreen data={data} setData={setData}/>}
{view==="calendar"&&<CalendarScreen data={data} setData={setData}/>}
{view==="health" &&<HealthScreen data={data} setData={setData}/>}
{view==="notes" &&<NotesScreen data={data} setData={setData}/>}
{view==="goals" &&<GoalsScreen data={data} setData={setData}/>}
{view==="habits" &&<HabitsScreen data={data} setData={setData}/>}
{view==="journal" &&<JournalScreen data={data} setData={setData}/>}
{view==="finance" &&<FinanceScreen data={data} setData={setData}/>}
{view==="focus" &&<FocusScreen/>}
{view==="news" &&<NewsScreen news={news} stocks={stocks}/>}
</div>
)}
</div>
</div>
<NavBar view={view} go={go} navOpen={navOpen} setNavOpen={setNavOpen} setAiOpen={setAiOpen} layout={layout} setLayout={setLayout}/>
{notifOpen&&<NotificationCenter data={data} setData={setData} onClose={()=>setNotifOpen(false)} go={go}/>}
{aiOpen&&<AISheet data={data} setData={setData} onClose={()=>setAiOpen(false)} go={go}/>}
{brainDump&&<BrainDump data={data} setData={setData} onClose={()=>setBrainDump(false)} go={go}/>}
{weeklyReview&&<WeeklyReview data={data} onClose={()=>setWeeklyReview(false)}/>}
{weeklyWrapped&&<WeeklyWrapped data={data} onClose={()=>setWeeklyWrapped(false)}/>}
</React.Fragment>
)}
</div>
</div>
</React.Fragment>
);
}
const FOCUS_OPTIONS = [
{id:"fitness", icon:"◈", label:"Fitness", desc:"Track workouts, steps, calories & sleep"},
{id:"work", icon:"▦", label:"Work", desc:"Tasks, deadlines, calendar & meetings"},
{id:"finance", icon:"$", label:"Finance", desc:"Budgets, savings goals & spending"},
{id:"mindset", icon:"◉", label:"Mindset", desc:"Journaling, habits & focus sessions"},
{id:"school", icon:"◫", label:"School", desc:"Assignments, study sessions & goals"},
{id:"health", icon:"◎", label:"Health", desc:"Food logging, macros & nutrition"},
];

const FOCUS_LAYOUTS = {
fitness:[
{id:"steps", size:"large", visible:true},
{id:"calories", size:"large", visible:true},
{id:"habits", size:"large", visible:true},
{id:"goals", size:"small", visible:true},
{id:"tasks", size:"medium", visible:false},
{id:"calendar", size:"medium", visible:false},
{id:"finance", size:"small", visible:false},
{id:"journal", size:"small", visible:false},
{id:"focus", size:"small", visible:false},
{id:"news", size:"large", visible:false},
{id:"stocks", size:"large", visible:false},
{id:"notes", size:"small", visible:false},
],
work:[
{id:"tasks", size:"large", visible:true},
{id:"calendar", size:"large", visible:true},
{id:"goals", size:"large", visible:true},
{id:"focus", size:"large", visible:true},
{id:"steps", size:"small", visible:false},
{id:"calories", size:"small", visible:false},
{id:"habits", size:"small", visible:false},
{id:"finance", size:"small", visible:false},
{id:"journal", size:"small", visible:false},
{id:"news", size:"large", visible:false},
{id:"stocks", size:"large", visible:false},
{id:"notes", size:"small", visible:false},
],
finance:[
{id:"finance", size:"large", visible:true},
{id:"stocks", size:"large", visible:true},
{id:"news", size:"large", visible:true},
{id:"goals", size:"large", visible:true},
{id:"tasks", size:"medium", visible:false},
{id:"calendar", size:"small", visible:false},
{id:"steps", size:"small", visible:false},
{id:"calories", size:"small", visible:false},
{id:"habits", size:"small", visible:false},
{id:"journal", size:"small", visible:false},
{id:"focus", size:"small", visible:false},
{id:"notes", size:"small", visible:false},
],
mindset:[
{id:"journal", size:"large", visible:true},
{id:"habits", size:"large", visible:true},
{id:"focus", size:"large", visible:true},
{id:"goals", size:"large", visible:true},
{id:"tasks", size:"medium", visible:false},
{id:"calendar", size:"small", visible:false},
{id:"steps", size:"small", visible:false},
{id:"calories", size:"small", visible:false},
{id:"finance", size:"small", visible:false},
{id:"news", size:"large", visible:false},
{id:"stocks", size:"large", visible:false},
{id:"notes", size:"medium", visible:false},
],
school:[
{id:"tasks", size:"large", visible:true},
{id:"calendar", size:"large", visible:true},
{id:"goals", size:"large", visible:true},
{id:"focus", size:"large", visible:true},
{id:"notes", size:"medium", visible:true},
{id:"steps", size:"small", visible:false},
{id:"calories", size:"small", visible:false},
{id:"habits", size:"small", visible:false},
{id:"finance", size:"small", visible:false},
{id:"journal", size:"small", visible:false},
{id:"news", size:"large", visible:false},
{id:"stocks", size:"large", visible:false},
],
health:[
{id:"calories", size:"large", visible:true},
{id:"steps", size:"large", visible:true},
{id:"habits", size:"large", visible:true},
{id:"goals", size:"large", visible:true},
{id:"journal", size:"small", visible:true},
{id:"tasks", size:"medium", visible:false},
{id:"calendar", size:"small", visible:false},
{id:"finance", size:"small", visible:false},
{id:"focus", size:"small", visible:false},
{id:"news", size:"large", visible:false},
{id:"stocks", size:"large", visible:false},
{id:"notes", size:"small", visible:false},
],
};
function mergeLayouts(ids){
if(ids.length===0)return DEFAULT_LAYOUT;
if(ids.length===1)return FOCUS_LAYOUTS[ids[0]]||DEFAULT_LAYOUT;
const allVisible=new Set();
ids.forEach(id=>{
(FOCUS_LAYOUTS[id]||[]).filter(w=>w.visible).forEach(w=>allVisible.add(w.id));
});
return DEFAULT_LAYOUT.map(w=>({
...w,
visible:allVisible.has(w.id),
size:(FOCUS_LAYOUTS[ids[0]]||[]).find(fw=>fw.id===w.id)?.size||w.size,
}));
}

function Onboarding({onComplete}){
const [step,setStep]=useState(0);
const [name,setName]=useState("");
const [selected,setSelected]=useState([]);
const [animDir,setAnimDir]=useState(1);

const next=()=>{setAnimDir(1);setStep(s=>s+1);};
const back=()=>{setAnimDir(-1);setStep(s=>s-1);};

const toggleFocus=(id)=>{
setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id].slice(0,3));
};

const finish=()=>{
const layout=mergeLayouts(selected);
onComplete(layout);
};

const previewWidgets=mergeLayouts(selected).filter(w=>w.visible).slice(0,4);

return(
<div style={{position:"absolute",inset:0,background:T.bg,display:DF,flexDirection:"column",zIndex:200,overflow:"hidden"}}>
<div style={{height:2,background:T.surface3,flexShrink:0}}>
<div style={{height:"100%",background:T.accent,borderRadius:1,transition:"width .4s ease",width:`${((step+1)/4)*100}%`}}/>
</div>
<div style={{flex:1,overflowY:"auto",padding:"0 28px 40px",display:DF,flexDirection:"column"}}>
{step===0&&(
<div className="page" style={{flex:1,display:DF,flexDirection:"column",justifyContent:"center",paddingTop:60}}>
<div style={{fontSize:48,marginBottom:24,textAlign:"center",color:T.accent,fontWeight:300,letterSpacing:"-.05em"}}>TDI</div>
<div style={{fontSize:34,fontWeight:800,letterSpacing:"-.06em",color:T.text1,textAlign:"center",lineHeight:1.1,marginBottom:12}}>Welcome to TDI</div>
<div style={{fontSize:16,color:T.text2,textAlign:"center",lineHeight:1.7,marginBottom:48,letterSpacing:LS}}>Your second brain. Built around you — not the other way around.</div>
<div style={{display:DF,flexDirection:"column",gap:14,marginBottom:32}}>
{[["◈","Takes 30 seconds to set up"],["◎","Built around your goals"],["✦","AI assistant included"]].map(([icon,text])=>(
<div key={text} style={{...R(),gap:14,padding:"14px 18px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:16}}>
<div style={{width:36,height:36,borderRadius:10,background:T.accentDim,display:DF,alignItems:AC,justifyContent:"center",fontSize:18,flexShrink:0}}>{icon}</div>
<div style={{fontSize:14,fontWeight:500,color:T.text1,letterSpacing:LS}}>{text}</div>
</div>
))}
</div>
<button className="btn-p" style={{width:"100%",padding:"16px",fontSize:16,borderRadius:16,letterSpacing:"-.02em"}} onClick={next}>Get Started →</button>
</div>
)}
{step===1&&(
<div className="page" style={{flex:1,display:DF,flexDirection:"column",justifyContent:"center",paddingTop:40}}>
<div style={{fontSize:13,fontWeight:700,letterSpacing:".08em",color:T.accent,marginBottom:12}}>STEP 1 OF 3</div>
<div style={{fontSize:30,fontWeight:800,letterSpacing:"-.05em",color:T.text1,marginBottom:8,lineHeight:1.1}}>What should we call you?</div>
<div style={{fontSize:15,color:T.text3,marginBottom:40,letterSpacing:LS}}>TDI will personalize your experience.</div>
<input
className="inp"
style={{fontSize:20,fontWeight:700,letterSpacing:"-.02em",padding:"18px 20px",borderRadius:16,marginBottom:20}}
placeholder="Your first name"
value={name}
onChange={e=>setName(e.target.value)}
onKeyDown={e=>e.key==="Enter"&&name.trim()&&next()}
autoFocus
/>
{name.trim()&&(
<div style={{fontSize:15,color:T.text2,marginBottom:40,letterSpacing:LS}}>Nice to meet you, <span style={{color:T.text1,fontWeight:700}}>{name}</span>.</div>
)}
<div style={{...R(),gap:12,marginTop:"auto"}}>
<button className="btn-s" style={{padding:"14px 20px"}} onClick={back}>← Back</button>
<button className="btn-p" style={{flex:1,padding:"14px",fontSize:15}} onClick={next} disabled={!name.trim()}>Continue →</button>
</div>
</div>
)}
{step===2&&(
<div className="page" style={{paddingTop:40}}>
<div style={{fontSize:13,fontWeight:700,letterSpacing:".08em",color:T.accent,marginBottom:12}}>STEP 2 OF 3</div>
<div style={{fontSize:30,fontWeight:800,letterSpacing:"-.05em",color:T.text1,marginBottom:8,lineHeight:1.1}}>What matters most{name?` to you, ${name}`:""}?</div>
<div style={{fontSize:15,color:T.text3,marginBottom:8,letterSpacing:LS}}>Pick up to 3. Your home screen will be built around these.</div>
<div style={{fontSize:12,color:T.accent,fontWeight:600,marginBottom:28}}>{selected.length}/3 selected</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
{FOCUS_OPTIONS.map(opt=>{
const on=selected.includes(opt.id);
return(
<div key={opt.id} onClick={()=>toggleFocus(opt.id)} style={{padding:"18px 16px",background:on?T.accentDim:T.surface2,border:`2px solid ${on?T.accent:T.border}`,borderRadius:18,cursor:CP,transition:"all .18s",opacity:!on&&selected.length>=3?.4:1}}>
<div style={{fontSize:28,marginBottom:8}}>{opt.icon}</div>
<div style={{fontSize:15,fontWeight:700,color:T.text1,letterSpacing:"-.02em",marginBottom:4}}>{opt.label}</div>
<div style={{fontSize:11,color:T.text3,lineHeight:1.5}}>{opt.desc}</div>
{on&&<div style={{marginTop:8,fontSize:11,fontWeight:700,color:T.accent}}>✓ Selected</div>}
</div>
);
})}
</div>
<div style={{...R(),gap:12}}>
<button className="btn-s" style={{padding:"14px 20px"}} onClick={back}>← Back</button>
<button className="btn-p" style={{flex:1,padding:"14px",fontSize:15}} onClick={next} disabled={selected.length===0}>Preview →</button>
</div>
</div>
)}
{step===3&&(
<div className="page" style={{paddingTop:40}}>
<div style={{fontSize:13,fontWeight:700,letterSpacing:".08em",color:T.accent,marginBottom:12}}>STEP 3 OF 3</div>
<div style={{fontSize:30,fontWeight:800,letterSpacing:"-.05em",color:T.text1,marginBottom:8,lineHeight:1.1}}>Your dashboard is ready</div>
<div style={{fontSize:15,color:T.text3,marginBottom:28,letterSpacing:LS}}>Built around {selected.map(id=>FOCUS_OPTIONS.find(o=>o.id===id)?.label).join(", ")}. You can customize it anytime.</div>
<div style={{background:T.surface1,border:`1px solid ${T.border}`,borderRadius:20,padding:16,marginBottom:28}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:T.text3,marginBottom:12}}>YOUR HOME SCREEN</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
{previewWidgets.map(w=>{
const def=WIDGET_DEFS[w.id];
const sz=def?.sizes.find(s=>s.key===w.size)||def?.sizes[0];
if(!def||!sz)return null;
return(
<div key={w.id} style={{gridColumn:`span ${sz.span}`,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px",minHeight:sz.span===2?70:80}}>
<div style={{fontSize:14,marginBottom:4}}>{def.icon}</div>
<div style={{fontSize:12,fontWeight:700,color:T.text1}}>{def.label}</div>
<div style={{fontSize:10,color:T.text3,marginTop:2}}>{sz.desc}</div>
</div>
);
})}
</div>
<div style={{fontSize:11,color:T.text3,marginTop:10,textAlign:"center"}}>+{mergeLayouts(selected).filter(w=>w.visible).length-previewWidgets.length} more widgets</div>
</div>
<div style={{...R(),gap:8,flexWrap:"wrap",marginBottom:32}}>
{selected.map(id=>{
const opt=FOCUS_OPTIONS.find(o=>o.id===id);
return <div key={id} style={{display:DF,alignItems:AC,gap:6,padding:"7px 14px",background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:20}}><span>{opt.icon}</span><span style={{fontSize:12,fontWeight:700,color:T.accent}}>{opt.label}</span></div>;
})}
</div>
<div style={{...R(),gap:12}}>
<button className="btn-s" style={{padding:"14px 20px"}} onClick={back}>← Back</button>
<button className="btn-p" style={{flex:1,padding:"16px",fontSize:15,letterSpacing:"-.02em"}} onClick={finish}>Let's go{name?`, ${name}`:""} →</button>
</div>
</div>
)}
</div>
{step===0&&(
<div style={{padding:"0 28px 36px",textAlign:"center",flexShrink:0}}>
<button onClick={()=>onComplete(DEFAULT_LAYOUT)} style={{fontSize:13,color:T.text3,background:"none",border:"none",cursor:CP,fontFamily:FI,letterSpacing:LS}}>Skip setup, use defaults</button>
</div>
)}
</div>
);
}
function NotificationCenter({data,setData,onClose,go}){
const unread=data.notifications.filter(n=>!n.read).length;
const markAllRead=()=>setData(d=>({...d,notifications:d.notifications.map(n=>({...n,read:true}))}));
const markRead=(id)=>setData(d=>({...d,notifications:d.notifications.map(n=>n.id===id?{...n,read:true}:n)}));
const clear=(id)=>setData(d=>({...d,notifications:d.notifications.filter(n=>n.id!==id)}));
const [showSettings,setShowSettings]=useState(false);

return(
<div style={{position:"absolute",top:"env(safe-area-inset-top)",left:0,right:0,bottom:0,zIndex:150,display:DF,flexDirection:"column",justifyContent:"flex-start"}}>
<div onClick={onClose} className="fadeIn" style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}/>
<div className="scaleIn" style={{position:"relative",zIndex:1,background:T.surface1,borderBottom:`1px solid ${T.border2}`,borderRadius:"0 0 24px 24px",maxHeight:"82dvh",display:DF,flexDirection:"column"}}>
<div style={{...R("space-between"),padding:"20px 20px 14px",borderBottom:`1px solid ${T.border}`}}>
<div>
<div style={{fontSize:18,fontWeight:800,letterSpacing:"-.03em",color:T.text1}}>Notifications</div>
{unread>0&&<div style={{fontSize:11,color:T.accent,marginTop:2,fontWeight:600}}>{unread} unread</div>}
</div>
<div style={R()}>
{unread>0&&<button onClick={markAllRead} style={{fontSize:12,fontWeight:600,color:T.text3,background:"none",border:"none",cursor:CP,fontFamily:FI,marginRight:8}}>Mark all read</button>}
<button onClick={()=>setShowSettings(v=>!v)} style={{fontSize:14,color:showSettings?T.accent:T.text3,background:"none",border:"none",cursor:CP,fontFamily:FI}}>⚙</button>
<button onClick={onClose} style={{background:T.surface3,border:`1px solid ${T.border2}`,borderRadius:"50%",width:28,height:28,cursor:CP,color:T.text3,display:DF,alignItems:AC,justifyContent:"center",fontFamily:FI,fontSize:14}}>×</button>
</div>
</div>
{showSettings&&(
<NotifSettings data={data} setData={setData}/>
)}
{!showSettings&&(
<div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
{data.notifications.length===0&&(
<div style={{padding:"32px 20px",textAlign:"center"}}>
<div style={{fontSize:36,marginBottom:12,color:T.text3,fontWeight:300}}>◬</div>
<div style={{fontSize:15,fontWeight:600,color:T.text1}}>All clear</div>
<div style={{fontSize:13,color:T.text3,marginTop:4}}>No notifications yet</div>
</div>
)}
{data.notifications.map((n,i)=>(
<div key={n.id} onClick={()=>markRead(n.id)} style={{...R(),gap:13,padding:"12px 20px",background:n.read?"transparent":"rgba(232,135,90,.04)",borderBottom:`1px solid ${T.border}`,cursor:CP,transition:"background .15s",position:"relative"}}>
{!n.read&&<div style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",width:6,height:6,borderRadius:"50%",background:T.accent}}/>}
<div style={{width:38,height:38,borderRadius:12,background:n.read?T.surface2:T.accentDim,border:`1px solid ${n.read?T.border:T.accent+"33"}`,display:DF,alignItems:AC,justifyContent:"center",fontSize:18,flexShrink:0}}>{n.icon}</div>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:14,fontWeight:n.read?500:700,color:T.text1,letterSpacing:LS}}>{n.title}</div>
<div style={{fontSize:12,color:T.text3,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.body}</div>
<div style={{fontSize:10,color:T.text3,marginTop:3,fontWeight:600}}>{n.time}</div>
</div>
<button onClick={e=>{e.stopPropagation();clear(n.id);}} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:18,padding:0,fontFamily:FI,flexShrink:0}}>×</button>
</div>
))}
</div>
)}
</div>
</div>
);
}
function NotifSettings({data,setData}){
const ns=data.notifSettings;
const toggle=(key)=>setData(d=>({...d,notifSettings:{...d.notifSettings,[key]:!d.notifSettings[key]}}));
const setVal=(key,val)=>setData(d=>({...d,notifSettings:{...d.notifSettings,[key]:val}}));
const toggleFavSource=(src)=>setData(d=>{
const favs=d.notifSettings.favSources;
return{...d,notifSettings:{...d.notifSettings,favSources:favs.includes(src)?favs.filter(s=>s!==src):[...favs,src]}};
});
const toggleFavSymbol=(sym)=>setData(d=>{
const favs=d.notifSettings.favSymbols;
return{...d,notifSettings:{...d.notifSettings,favSymbols:favs.includes(sym)?favs.filter(s=>s!==sym):[...favs,sym]}};
});

const SOURCES=["Reuters","WSJ","AP","Bloomberg","NYT","CNN"];
const SYMBOLS=["SPY","QQQ","DOW","BTC","AAPL","TSLA","NVDA","MSFT"];

const Row=({label,desc,on,onToggle})=>(
<div style={{...R("space-between"),padding:"12px 20px",borderBottom:`1px solid ${T.border}`}}>
<div>
<div style={{fontSize:14,fontWeight:600,color:T.text1}}>{label}</div>
{desc&&<div style={{fontSize:11,color:T.text3,marginTop:1}}>{desc}</div>}
</div>
<div onClick={onToggle} style={{width:44,height:26,borderRadius:13,background:on?T.accent:T.surface3,border:`1px solid ${on?T.accent:T.border2}`,cursor:CP,position:"relative",transition:"background .2s",flexShrink:0}}>
<div style={{position:"absolute",top:3,left:on?21:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
</div>
</div>
);

return(
<div style={{overflowY:"auto",maxHeight:360}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".07em",color:T.text3,padding:"12px 20px 6px"}}>NOTIFY ME ABOUT</div>
<Row label="Events" desc="1 hour before + day-of reminder" on={ns.events} onToggle={()=>toggle("events")}/>
<Row label="Habits" desc="At your custom time per habit" on={ns.habits} onToggle={()=>toggle("habits")}/>
<Row label="Steps" desc={`Reminder at ${ns.stepReminderTime} if under goal`} on={ns.steps} onToggle={()=>toggle("steps")}/>
<Row label="Goals" desc="Celebrate when you hit 100%" on={ns.goals} onToggle={()=>toggle("goals")}/>
<Row label="News alerts" desc="Only for favorited sources" on={ns.news} onToggle={()=>toggle("news")}/>
<Row label="Stock alerts" desc="Only for favorited tickers" on={ns.stocks} onToggle={()=>toggle("stocks")}/>
<div style={{...R("space-between"),padding:"12px 20px 6px 20px",borderTop:`1px solid ${T.border}`,marginTop:4}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".07em",color:T.text3}}>STEP REMINDER TIME</div>
<input type="time" value={ns.stepReminderTime} onChange={e=>setVal("stepReminderTime",e.target.value)} style={{background:T.surface3,border:`1px solid ${T.border2}`,borderRadius:8,padding:"4px 8px",color:T.text1,fontFamily:FI,fontSize:13,colorScheme:"dark"}}/>
</div>

{ns.news&&(
<React.Fragment>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".07em",color:T.text3,padding:"10px 20px 6px"}}>FAVORITE NEWS SOURCES</div>
<div style={{display:DF,flexWrap:"wrap",gap:6,padding:"0 20px 12px"}}>
{SOURCES.map(src=>(
<div key={src} onClick={()=>toggleFavSource(src)} style={{fontSize:12,fontWeight:600,padding:"5px 12px",borderRadius:20,border:`1px solid ${ns.favSources.includes(src)?T.accent:T.border2}`,background:ns.favSources.includes(src)?T.accentDim:"transparent",color:ns.favSources.includes(src)?T.accent:T.text3,cursor:CP,transition:"all .15s"}}>{src}</div>
))}
</div>
</React.Fragment>
)}

{ns.stocks&&(
<React.Fragment>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".07em",color:T.text3,padding:"10px 20px 6px"}}>FAVORITE TICKERS</div>
<div style={{display:DF,flexWrap:"wrap",gap:6,padding:"0 20px 16px"}}>
{SYMBOLS.map(sym=>(
<div key={sym} onClick={()=>toggleFavSymbol(sym)} style={{fontSize:12,fontWeight:600,padding:"5px 12px",borderRadius:20,border:`1px solid ${ns.favSymbols.includes(sym)?T.accent:T.border2}`,background:ns.favSymbols.includes(sym)?T.accentDim:"transparent",color:ns.favSymbols.includes(sym)?T.accent:T.text3,cursor:CP,transition:"all .15s"}}>{sym}</div>
))}
</div>
</React.Fragment>
)}
</div>
);
}
function NavBar({view,go,navOpen,setNavOpen,setAiOpen,layout,setLayout}){
const [showCustomize,setShowCustomize]=useState(false);
const swipeStartY=useRef(0);
const navSheetRef=useRef(null);
useEffect(()=>{
const el=navSheetRef.current;
if(!el)return;
const handler=e=>e.preventDefault();
el.addEventListener("touchmove",handler,{passive:false});
return()=>el.removeEventListener("touchmove",handler);
},[]);
const TABS=[
{id:"home",icon:"⌂",l:"Home"},{id:"tasks",icon:"✓",l:"Tasks"},
{id:"calendar",icon:"▦",l:"Calendar"},{id:"health",icon:"◈",l:"Health"},
{id:"habits",icon:"◇",l:"Habits"},{id:"finance",icon:"$",l:"Finance"},
{id:"journal",icon:"✎",l:"Journal"},{id:"focus",icon:"◉",l:"Focus"},
{id:"news",icon:"▤",l:"News"},{id:"notes",icon:"✐",l:"Notes"},
{id:"goals",icon:"◎",l:"Goals"},
];
return(
<React.Fragment>
{navOpen&&<div onClick={()=>{setNavOpen(false);setShowCustomize(false);}} onTouchMove={e=>e.preventDefault()} className="fadeIn" style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",zIndex:50,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}/>}
{navOpen&&!showCustomize&&(
<div ref={navSheetRef} className="sheet nav-sheet" onTouchStart={e=>{swipeStartY.current=e.touches[0].clientY;navSheetRef.current.style.transition="none";}} onTouchMove={e=>{const dy=Math.max(0,e.touches[0].clientY-swipeStartY.current);navSheetRef.current.style.transform=`translateY(${dy}px)`;}} onTouchEnd={e=>{const dy=e.changedTouches[0].clientY-swipeStartY.current;navSheetRef.current.style.transition="transform .3s cubic-bezier(.16,1,.3,1)";if(dy>80){navSheetRef.current.style.transform="translateY(100%)";setTimeout(()=>{setNavOpen(false);setShowCustomize(false);navSheetRef.current&&(navSheetRef.current.style.transform="");},300);}else{navSheetRef.current.style.transform="";}}} style={{position:"absolute",bottom:0,left:0,right:0,zIndex:51,padding:"10px 18px 48px"}}>
<div style={{width:36,height:4,background:T.border2,borderRadius:2,margin:"6px auto 20px"}}/>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
{TABS.slice(0,8).map(t=>(
<div key={t.id} onClick={()=>go(t.id)} className="tappable" style={{display:DF,flexDirection:"column",alignItems:AC,gap:6,padding:"13px 4px",background:view===t.id?T.surface3:T.surface2,border:`1px solid ${view===t.id?T.border2:T.border}`,borderRadius:14,cursor:CP,transition:"background .15s"}}>
<span style={{fontSize:18,lineHeight:1,color:view===t.id?T.accent:T.text2}}>{t.icon}</span>
<span style={{fontSize:10,fontWeight:view===t.id?700:500,color:view===t.id?T.text1:T.text3,letterSpacing:LS}}>{t.l}</span>
</div>
))}
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7,marginBottom:12}}>
{TABS.slice(8).map(t=>(
<div key={t.id} onClick={()=>go(t.id)} className="tappable" style={{display:DF,alignItems:AC,gap:10,padding:"12px 14px",background:view===t.id?T.surface3:T.surface2,border:`1px solid ${view===t.id?T.border2:T.border}`,borderRadius:14,cursor:CP,transition:"background .15s"}}>
<span style={{fontSize:18,color:view===t.id?T.accent:T.text2}}>{t.icon}</span>
<span style={{fontSize:13,fontWeight:view===t.id?700:500,color:view===t.id?T.text1:T.text3}}>{t.l}</span>
</div>
))}
</div>
<div onClick={()=>{setAiOpen(true);setNavOpen(false);}} className="card tappable" style={{...R(),gap:14,padding:"13px 16px",cursor:CP,marginBottom:9}}>
<div style={{width:38,height:38,borderRadius:11,background:T.accentDim,border:`1px solid ${T.accent}33`,display:DF,alignItems:AC,justifyContent:"center",fontSize:17,flexShrink:0,color:T.accent}}>✦</div>
<div><div style={{fontSize:14,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>TDI Assistant</div><div style={{fontSize:11,color:T.text3,marginTop:1}}>Add anything · text or voice</div></div>
<div style={{marginLeft:"auto",color:T.text3,fontSize:18}}>›</div>
</div>
<div onClick={()=>setShowCustomize(true)} className="card tappable" style={{...R(),gap:14,padding:"13px 16px",cursor:CP}}>
<div style={{width:38,height:38,borderRadius:11,background:T.surface3,border:`1px solid ${T.border2}`,display:DF,alignItems:AC,justifyContent:"center",fontSize:17,flexShrink:0,color:T.text2}}>⊞</div>
<div><div style={{fontSize:14,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>Customize Widgets</div><div style={{fontSize:11,color:T.text3,marginTop:1}}>Resize · reorder · show/hide</div></div>
<div style={{marginLeft:"auto",color:T.text3,fontSize:18}}>›</div>
</div>
</div>
)}
{navOpen&&showCustomize&&(
<WidgetCustomizeSheet layout={layout} setLayout={setLayout} onBack={()=>setShowCustomize(false)} onDone={()=>{setShowCustomize(false);setNavOpen(false);go("home");}}/>
)}
<div style={{position:"absolute",bottom:0,left:0,right:0,display:DF,justifyContent:"center",padding:"0 0 8px",zIndex:40,pointerEvents:"none"}}>
<div onClick={()=>{setNavOpen(v=>!v);setShowCustomize(false);}} className="navpill" style={{padding:"13px 36px",cursor:CP,display:DF,alignItems:AC,gap:7,userSelect:"none",pointerEvents:"all",transition:"all .18s"}}>
<div style={{width:5,height:5,borderRadius:"50%",background:navOpen?T.accent:T.text3,transition:"background .2s"}}/>
<div style={{width:28,height:4,borderRadius:3,background:navOpen?T.accent:T.border2,transition:"all .2s"}}/>
<div style={{width:5,height:5,borderRadius:"50%",background:navOpen?T.accent:T.text3,transition:"background .2s"}}/>
</div>
</div>
</React.Fragment>
);
}
function WidgetCustomizeSheet({layout,setLayout,onBack,onDone}){
const [selected,setSelected]=useState(null);
const [dragIdx,setDragIdx]=useState(null);
const [dragOverIdx,setDragOverIdx]=useState(null);
const listDragIdx=useRef(null);
const listDragOverIdx=useRef(null);
const containerRef=useRef(null);
useEffect(()=>{
const el=containerRef.current;
if(!el)return;
const handler=e=>e.preventDefault();
el.addEventListener("touchmove",handler,{passive:false});
return()=>el.removeEventListener("touchmove",handler);
},[]);
const vis=layout.filter(w=>w.visible);
const hid=layout.filter(w=>!w.visible);
const setSize=(id,size)=>{setLayout(l=>l.map(w=>w.id===id?{...w,size}:w));setSelected(null);};
const toggle=(id)=>{setLayout(l=>l.map(w=>w.id===id?{...w,visible:!w.visible}:w));setSelected(null);};
const reorder=(from,to,arr)=>{const n=[...arr];const[m]=n.splice(from,1);n.splice(to,0,m);setLayout([...n,...hid]);};

return(
<div className="slideUp sheet" style={{position:"absolute",bottom:0,left:0,right:0,zIndex:52,maxHeight:"94dvh",display:DF,flexDirection:"column"}}>
<div style={{padding:"0 18px",flexShrink:0}}>
<div style={{width:36,height:4,background:T.border2,borderRadius:2,margin:"10px auto 16px"}}/>
<div style={{...R("space-between"),marginBottom:14}}>
<button onClick={onBack} style={{fontSize:14,fontWeight:600,color:T.accent,background:"none",border:"none",cursor:CP,fontFamily:FI}}>‹ Back</button>
<div style={{fontSize:16,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>Customize</div>
<button onClick={onDone} style={{fontSize:14,fontWeight:700,color:T.accent,background:"none",border:"none",cursor:CP,fontFamily:FI}}>Done</button>
</div>
<div style={{fontSize:11,color:T.text3,textAlign:"center",marginBottom:14}}>Drag to rearrange · tap to resize</div>
</div>
<div style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
<div style={{marginBottom:20,padding:"12px",background:T.surface1,border:`1px solid ${T.border}`,borderRadius:16}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:10}}>LIVE PREVIEW</div>
<div ref={containerRef} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
{vis.map((item,idx)=>{
const def=WIDGET_DEFS[item.id];if(!def)return null;
const sz=def.sizes.find(s=>s.key===item.size)||def.sizes[0];
const isDragging=dragIdx===idx;
const isOver=dragOverIdx===idx&&dragIdx!==idx;
const isSel=selected===item.id;
return(
<div key={item.id}
onTouchStart={()=>{listDragIdx.current=idx;setDragIdx(idx);}}
onTouchMove={e=>{e.preventDefault();
const touch=e.touches[0];
const el=document.elementFromPoint(touch.clientX,touch.clientY);
const idx2=el?.closest("[data-widgetidx]")?.dataset?.widgetidx;
if(idx2!==undefined&&+idx2!==listDragIdx.current){listDragOverIdx.current=+idx2;setDragOverIdx(+idx2);}
}}
onTouchEnd={()=>{
if(listDragIdx.current!==null&&listDragOverIdx.current!==null&&listDragIdx.current!==listDragOverIdx.current)reorder(listDragIdx.current,listDragOverIdx.current,vis);
listDragIdx.current=null;listDragOverIdx.current=null;setDragIdx(null);setDragOverIdx(null);
}}
onClick={()=>setSelected(isSel?null:item.id)}
data-widgetidx={idx}
className="no-select"
style={{gridColumn:`span ${sz.span}`,minHeight:sz.rows===2?120:70,background:isSel?T.surface3:isOver?"rgba(232,135,90,.1)":T.surface2,border:`1.5px solid ${isSel?T.accent:isOver?T.accent:T.border}`,borderRadius:12,padding:"11px 12px",cursor:"grab",opacity:isDragging?.35:1,transition:"opacity .15s,border-color .15s",position:"relative",userSelect:"none"}}
>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:3}}>{def.label.toUpperCase()}</div>
<div style={{fontSize:11,color:T.text2}}>{sz.desc}</div>
<div style={{...R(),gap:2,marginTop:8}}>
{Array.from({length:sz.span}).map((_,c)=>(
<div key={c} style={{display:DF,flexDirection:"column",gap:2}}>
{Array.from({length:sz.rows}).map((_,r)=>(
<div key={r} style={{width:sz.span===1?18:10,height:8,background:isSel?T.accent:"rgba(255,255,255,.12)",borderRadius:2}}/>
))}
</div>
))}
</div>
<div onClick={e=>{e.stopPropagation();toggle(item.id);}} style={{position:"absolute",top:-7,right:-7,width:20,height:20,borderRadius:"50%",background:T.accent,color:"#fff",display:DF,alignItems:AC,justifyContent:"center",fontSize:13,fontWeight:700,cursor:CP,boxShadow:"0 2px 8px rgba(0,0,0,.4)"}}> − </div>
<div style={{position:"absolute",bottom:5,right:8,fontSize:9,fontWeight:700,color:T.text3}}>{sz.label.toUpperCase()}</div>
</div>
);
})}
</div>
</div>

{selected&&(()=>{
const item=vis.find(w=>w.id===selected);if(!item)return null;
const def=WIDGET_DEFS[item.id];
return(
<div className="scaleIn" style={{marginBottom:18,padding:"14px 16px",background:T.surface2,border:`1px solid ${T.accent}`,borderRadius:14}}>
<div style={{...R("space-between"),marginBottom:12}}>
<div style={{fontSize:13,fontWeight:700,color:T.text1}}>{def.icon} {def.label} — Size</div>
<button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:18,fontFamily:FI}}>×</button>
</div>
<div style={{display:DF,gap:8,flexWrap:"wrap"}}>
{def.sizes.map(sz=>{
const isAct=item.size===sz.key;
return(
<div key={sz.key} onClick={()=>setSize(item.id,sz.key)} style={{flex:1,minWidth:72,padding:"12px 10px",background:isAct?T.accentDim:T.surface3,border:`1.5px solid ${isAct?T.accent:T.border2}`,borderRadius:12,cursor:CP,textAlign:"center",transition:"all .15s"}}>
<div style={{display:DF,justifyContent:"center",gap:3,marginBottom:8}}>
{Array.from({length:sz.span}).map((_,c)=>(
<div key={c} style={{display:DF,flexDirection:"column",gap:2}}>
{Array.from({length:sz.rows}).map((_,r)=>(
<div key={r} style={{width:sz.span===1?22:12,height:12,background:isAct?T.accent:"rgba(255,255,255,.18)",borderRadius:2}}/>
))}
</div>
))}
</div>
<div style={{fontSize:12,fontWeight:700,color:isAct?T.accent:T.text2}}>{sz.label}</div>
<div style={{fontSize:10,color:T.text3,marginTop:2}}>{sz.desc}</div>
</div>
);
})}
</div>
</div>
);
})()}

{hid.length>0&&(
<React.Fragment>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:10}}>ADD WIDGETS</div>
{hid.map(item=>{
const def=WIDGET_DEFS[item.id];if(!def)return null;
return(
<div key={item.id} style={{...R("space-between"),padding:"12px 14px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:7,cursor:CP}} onClick={()=>toggle(item.id)}>
<div style={R()}>
<div style={{width:22,height:22,borderRadius:"50%",background:T.accent,display:DF,alignItems:AC,justifyContent:"center",fontSize:14,color:"#fff",fontWeight:700,flexShrink:0}}>+</div>
<div style={{fontSize:14,fontWeight:600,color:T.text1,letterSpacing:LS}}>{def.icon} {def.label}</div>
</div>
</div>
);
})}
</React.Fragment>
)}
<div style={{height:20}}/>
</div>
</div>
);
}
function HomeScreen({data,layout,go,setAiOpen,news,stocks,setBrainDump,setWeeklyReview,setWeeklyWrapped}){
const steps=data.health.steps[data.health.steps.length-1]?.count||0;
const stepPct=Math.min(100,Math.round((steps/data.health.stepGoal)*100));
const cals=data.health.foodLog.reduce((s,f)=>s+f.calories,0);
const calPct=Math.min(100,Math.round((cals/data.health.calorieGoal)*100));
const pending=data.tasks.filter(t=>!t.done);
const todayISO=new Date().toISOString().split("T")[0];const taskEvents=data.tasks.filter(t=>t.due&&t.due>=todayISO).map(t=>({id:"task-"+t.id,title:t.text,date:t.due,time:t.dueTime||"",color:T.accent,isTask:true,taskId:t.id,done:t.done}));const upEvents=[...data.events,...taskEvents].filter(e=>e.date>=todayISO).sort((a,b)=>a.date.localeCompare(b.date));
const todayStr=new Date().toISOString().split("T")[0];
const today=new Date();
const totalSpent=data.finance.categories.reduce((s,c)=>s+c.spent,0);
const totalBudget=data.finance.categories.reduce((s,c)=>s+c.budget,0);
const todayHabits=data.habits.filter(h=>h.completedDates.includes(todayStr));
const vis=layout.filter(w=>w.visible);

const renderWidget=(item)=>{
const def=WIDGET_DEFS[item.id];
const sz=def?.sizes.find(s=>s.key===item.size)||def?.sizes[0];
if(!def||!sz)return null;
const dest=item.id==="steps"||item.id==="calories"?"health"
:item.id==="calendar"?"calendar"
:item.id==="news"||item.id==="stocks"?"news"
:item.id;

let inner=null;
try{
if(item.id==="steps") inner=(
<React.Fragment>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:6}}>STEPS</div>
<div style={{fontSize:sz.span===2?34:28,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>{steps.toLocaleString()}</div>
<div style={{fontSize:10,color:T.text3,margin:"3px 0 8px"}}>of {data.health.stepGoal.toLocaleString()}</div>
<div className="pbar"><div className="pfill" style={{width:`${stepPct}%`,background:T.accent}}/></div>
<div style={{fontSize:9,color:T.text3,marginTop:6,letterSpacing:".01em"}}>Sync with Apple Health coming soon</div>
{sz.span===2&&(
<div style={{display:DF,alignItems:"flex-end",gap:4,height:32,marginTop:10}}>
{data.health.steps.map((d,i)=>{
const mx=Math.max(...data.health.steps.map(s=>s.count),1);
const hp=(d.count/mx)*100;
const it=i===data.health.steps.length-1;
return <div key={i} style={{flex:1,height:`${Math.max(hp,6)}%`,background:it?T.accent:T.surface3,borderRadius:"2px 2px 0 0",transition:"height .3s"}}/>;
})}
</div>
)}
</React.Fragment>
);
else if(item.id==="calories") inner=(
<React.Fragment>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:6}}>CALORIES</div>
<div style={{fontSize:sz.span===2?34:28,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>{cals}</div>
<div style={{fontSize:10,color:T.text3,margin:"3px 0 8px"}}>{Math.max(0,data.health.calorieGoal-cals)} left</div>
<div className="pbar"><div className="pfill" style={{width:`${calPct}%`,background:T.accent}}/></div>
</React.Fragment>
);
else if(item.id==="tasks"){
const maxR=item.size==="large"?5:item.size==="medium"?3:1;
inner=(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:8}}>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3}}>TASKS</div>
<div style={{fontSize:10,fontWeight:700,color:T.accent}}>{pending.length}</div>
</div>
{pending.length===0?<div style={{fontSize:12,color:T.text3}}>All done</div>
:pending.slice(0,maxR).map((t,i)=>(
<div key={t.id} style={{...R(),gap:8,padding:"5px 0",borderBottom:i<Math.min(pending.length,maxR)-1?`1px solid ${T.border}`:"none"}}>
<div style={{width:5,height:5,borderRadius:"50%",background:P_C[t.priority],flexShrink:0}}/>
<span style={{flex:1,fontSize:12,color:T.text1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</span>
</div>
))}
</React.Fragment>
);
}
else if(item.id==="calendar"){
const todayEvents=upEvents.filter(e=>e.date===todayStr);
if(item.size==="small") inner=(
<React.Fragment>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:6}}>TODAY</div>
<div style={{fontSize:28,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>{new Date().getDate()}</div>
<div style={{fontSize:9,color:T.text3,marginBottom:8}}>{new Date().toLocaleDateString("en-US",{month:"short"}).toUpperCase()}</div>
{todayEvents.length===0?<div style={{fontSize:10,color:T.text3}}>Nothing today</div>
:todayEvents.slice(0,2).map(e=>(
<div key={e.id} style={{...R(),gap:5,marginBottom:3}}>
<div style={{width:3,height:3,borderRadius:"50%",background:T.accent,flexShrink:0}}/>
<span style={{fontSize:10,color:T.text2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</span>
</div>
))}
</React.Fragment>
);
else if(item.size==="large") inner=(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:6}}>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3}}>CALENDAR</div>
<div style={{fontSize:9,color:T.text3}}>{new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}).toUpperCase()}</div>
</div>
{(()=>{const now=new Date();const firstDay=new Date(now.getFullYear(),now.getMonth(),1).getDay();const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();const cells=[...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];const todayDate=now.getDate();return(<React.Fragment><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:3}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:7,fontWeight:700,color:T.text3}}>{d}</div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>{cells.map((day,i)=>{if(day===null)return <div key={i}/>;const isToday=day===todayDate;const ds=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const hasEvt=upEvents.some(e=>e.date===ds);return(<div key={i} style={{aspectRatio:"1",display:DF,alignItems:AC,justifyContent:"center",borderRadius:4,background:isToday?T.accent:"transparent",position:"relative"}}><span style={{fontSize:9,fontWeight:isToday?700:400,color:isToday?"#fff":T.text2}}>{day}</span>{hasEvt&&!isToday&&<div style={{position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)",width:3,height:3,borderRadius:"50%",background:T.accent}}/>}</div>);})}</div></React.Fragment>);})()}
</React.Fragment>
);
else inner=(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:10}}>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3}}>UPCOMING</div>
</div>
{upEvents.length===0?<div style={{fontSize:12,color:T.text3}}>Nothing scheduled</div>
:upEvents.slice(0,3).map((e,i)=>(
<div key={e.id} style={{...R(),gap:10,padding:"5px 0",borderBottom:i<Math.min(upEvents.length,3)-1?`1px solid ${T.border}`:"none"}}>
<div style={{width:3,height:26,borderRadius:2,background:T.accent,flexShrink:0}}/>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:12,fontWeight:600,color:T.text1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
<div style={{fontSize:10,color:T.text3}}>{e.time}</div>
</div>
</div>
))}
</React.Fragment>
);
}
else if(item.id==="habits") inner=(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:item.size==="small"?4:10}}>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3}}>HABITS</div>
<div style={{fontSize:10,fontWeight:700,color:T.accent}}>{todayHabits.length}/{data.habits.length}</div>
</div>
{item.size==="small"?(
<React.Fragment>
<div style={{fontSize:28,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>{todayHabits.length}</div>
<div style={{fontSize:10,color:T.text3,marginTop:3}}>done today</div>
</React.Fragment>
):data.habits.slice(0,3).map((h,i)=>{
const done=h.completedDates.includes(todayStr);
return(
<div key={h.id} style={{...R(),gap:9,padding:"5px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
<span style={{fontSize:14}}>{h.icon}</span>
<span style={{flex:1,fontSize:12,color:done?T.text1:T.text3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</span>
{done&&<span style={{fontSize:10,color:T.accent,fontWeight:700}}>✓</span>}
</div>
);
})}
</React.Fragment>
);
else if(item.id==="finance") inner=(
<React.Fragment>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:6}}>BUDGET</div>
<div style={{fontSize:sz.span===2?34:28,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>${totalSpent}</div>
<div style={{fontSize:10,color:T.text3,margin:"3px 0 8px"}}>of ${totalBudget}</div>
<div className="pbar"><div className="pfill" style={{width:`${totalBudget>0?Math.min(100,Math.round(totalSpent/totalBudget*100)):0}%`,background:T.accent}}/></div>
</React.Fragment>
);
else if(item.id==="goals"){
const complete=data.goals.filter(g=>g.progress===100).length;
const pct=data.goals.length>0?Math.round((complete/data.goals.length)*100):0;
if(item.size==="small") inner=(
<React.Fragment>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:6}}>GOALS</div>
<div style={{position:"relative",width:48,height:48,margin:"0 auto 4px"}}>
<svg width="48" height="48" style={{transform:"rotate(-90deg)"}}>
<circle cx="24" cy="24" r="20" fill="none" stroke={T.surface3} strokeWidth="5"/>
<circle cx="24" cy="24" r="20" fill="none" stroke={T.accent} strokeWidth="5" strokeDasharray={`${2*Math.PI*20}`} strokeDashoffset={`${2*Math.PI*20*(1-pct/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset .5s"}}/>
</svg>
<div style={{position:"absolute",inset:0,display:DF,alignItems:AC,justifyContent:"center",fontSize:10,fontWeight:800,color:T.text1}}>{pct}%</div>
</div>
<div style={{fontSize:10,color:T.text3,textAlign:"center"}}>{complete}/{data.goals.length}</div>
</React.Fragment>
);
else inner=(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:10}}>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3}}>GOALS</div>
<div style={{fontSize:10,color:T.text3,fontWeight:700}}>{complete}/{data.goals.length}</div>
</div>
{data.goals.map((g,i)=>(
<div key={g.id} style={{marginBottom:i<data.goals.length-1?10:0}}>
<div style={{...R("space-between"),marginBottom:4}}>
<span style={{fontSize:12,fontWeight:500,color:T.text1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"75%"}}>{g.title}</span>
<span style={{fontSize:11,fontWeight:700,color:T.accent,flexShrink:0}}>{g.progress}%</span>
</div>
<div className="pbar"><div className="pfill" style={{width:`${g.progress}%`,background:T.accent}}/></div>
</div>
))}
</React.Fragment>
);
}
else if(item.id==="notes") inner=(
<React.Fragment>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:8}}>NOTES</div>
{item.size==="small"?(
<React.Fragment>
<div style={{fontSize:28,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>{data.notes.length}</div>
<div style={{fontSize:10,color:T.text3,marginTop:3}}>notes</div>
</React.Fragment>
):data.notes.slice(0,2).map((n,i)=>(
<div key={n.id} style={{padding:"5px 0",borderBottom:i<1?`1px solid ${T.border}`:"none"}}>
<div style={{fontSize:12,fontWeight:600,color:T.text1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</div>
<div style={{fontSize:10,color:T.text3,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.content||"Empty"}</div>
</div>
))}
</React.Fragment>
);
else if(item.id==="journal"){
const todayStr=new Date().toISOString().split("T")[0];
const todayEntry=data.journal.find(j=>j.date===todayStr);
const streak=(()=>{let s=0;const d=new Date();let mi=400;while(mi-->0){const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;if(!data.journal.find(j=>j.date===ds))break;s++;d.setDate(d.getDate()-1);}return s;})();
inner=(
<React.Fragment>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:6}}>JOURNAL</div>
{item.size==="small"?(
<React.Fragment>
<div style={{fontSize:28,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>{streak}</div>
<div style={{fontSize:10,color:T.text3,marginTop:3}}>day streak</div>
<div style={{fontSize:10,color:todayEntry?T.accent:T.text3,marginTop:6,fontWeight:600}}>{todayEntry?"✓ Written today":"Not written yet"}</div>
</React.Fragment>
):(
<React.Fragment>
<div style={{fontSize:10,color:T.text3,marginBottom:6}}>{todayEntry?"Today's entry":"No entry yet — tap to write"}</div>
<div style={{fontSize:13,color:todayEntry?T.text1:T.text3,lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>{todayEntry?.content||"Start your daily reflection..."}</div>
</React.Fragment>
)}
</React.Fragment>
);
}
else if(item.id==="focus"){
inner=(
<React.Fragment>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3,marginBottom:6}}>FOCUS</div>
{item.size==="small"?(
<React.Fragment>
<div style={{fontSize:28,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>0</div>
<div style={{fontSize:10,color:T.text3,marginTop:3}}>sessions today</div>
<div style={{fontSize:10,color:T.accent,marginTop:6,fontWeight:600}}>25:00 ready</div>
</React.Fragment>
):(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:8}}>
<div style={{fontSize:36,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>25:00</div>
<div style={{fontSize:11,color:T.text3}}>0 sessions</div>
</div>
<div style={{fontSize:11,color:T.text2}}>Tap to start a focus session</div>
</React.Fragment>
)}
</React.Fragment>
);
}
else if(item.id==="news"){
const loading=news.length===0;
inner=(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:8}}>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3}}>NEWS</div>
<div style={{fontSize:9,color:T.text3}}>LIVE</div>
</div>
{loading?(
<div style={{fontSize:12,color:T.text3,animation:"pulse 1.5s ease infinite"}}>Loading headlines...</div>
):item.size==="small"?(
<div style={{fontSize:12,fontWeight:500,color:T.text1,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>{news[0]?.headline}</div>
):news.slice(0,4).map((n,i)=>(
<div key={i} style={{padding:"6px 0",borderBottom:i<3?`1px solid ${T.border}`:"none"}}>
<div style={{fontSize:11,fontWeight:600,color:T.text1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.headline}</div>
<div style={{fontSize:9,color:T.text3,marginTop:2}}>{n.source} · {n.category}</div>
</div>
))}
</React.Fragment>
);
}
else if(item.id==="stocks"){
const loading=stocks.length===0;
inner=(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:8}}>
<div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",color:T.text3}}>MARKETS</div>
<div style={{fontSize:9,color:T.text3}}>LIVE</div>
</div>
{loading?(
<div style={{fontSize:12,color:T.text3,animation:"pulse 1.5s ease infinite"}}>Fetching markets...</div>
):stocks.slice(0,item.size==="small"?2:5).map((s,i,arr)=>(
<div key={i} style={{...R("space-between"),padding:"4px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
<div>
<div style={{fontSize:11,fontWeight:700,color:T.text1}}>{s.symbol}</div>
{item.size==="large"&&<div style={{fontSize:9,color:T.text3}}>{s.name}</div>}
</div>
<div style={{textAlign:"right"}}>
<div style={{fontSize:11,fontWeight:600,color:T.text1}}>{s.price}</div>
<div style={{fontSize:9,fontWeight:700,color:s.change?.startsWith("-")?T.text3:T.accent}}>{s.change}</div>
</div>
</div>
))}
</React.Fragment>
);
}
}catch(err){ inner=<div style={{fontSize:11,color:T.text3}}>—</div>; }

return(
<div key={item.id} className="card tappable" onClick={()=>go(dest)} style={{gridColumn:`span ${sz.span}`,gridRow:`span ${sz.rows}`,padding:sz.rows===2?"16px 18px":"14px 15px",cursor:CP,minHeight:sz.rows===2?160:sz.span===2?88:82}}>
{inner}
</div>
);
};

return(
<div className="page" style={{paddingTop:20}}>
<div style={{...R("space-between"),marginBottom:12}}>
<div>
{`${DAYS[today.getDay()].toUpperCase()}, ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase()}`}
<div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>Dashboard</div>
</div>
<div onClick={()=>setAiOpen(true)} className="tappable" style={{...R(),gap:8,padding:"9px 14px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,cursor:CP}}>
<span style={{fontSize:13,color:T.accent}}>✦</span>
<span style={{fontSize:13,fontWeight:600,color:T.text2,letterSpacing:LS}}>Ask TDI</span>
</div>
</div>
{/* Brain Dump CTA */}
<div onClick={()=>setBrainDump(true)} className="tappable" style={{...R(),gap:14,padding:"14px 18px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:18,cursor:CP,marginBottom:8,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${T.accentDim},transparent)`,pointerEvents:"none"}}/>
<div style={{width:40,height:40,borderRadius:12,background:T.accentDim,border:`1px solid ${T.accent}44`,display:DF,alignItems:AC,justifyContent:"center",fontSize:20,flexShrink:0,color:T.accent,fontWeight:300,zIndex:1}}>⊕</div>
<div style={{zIndex:1}}>
<div style={{fontSize:15,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>Brain Dump</div>
<div style={{fontSize:12,color:T.text3,marginTop:1}}>Say everything on your mind. TDI sorts it.</div>
</div>
<div style={{marginLeft:"auto",color:T.text3,fontSize:18,zIndex:1}}>›</div>
</div>
<div onClick={()=>setWeeklyReview(true)} className="tappable" style={{...R(),gap:14,padding:"14px 18px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:18,cursor:CP,marginBottom:12,position:"relative",overflow:"hidden"}}>
<div style={{width:40,height:40,borderRadius:12,background:`rgba(232,135,90,0.08)`,border:`1px solid ${T.border2}`,display:DF,alignItems:AC,justifyContent:"center",fontSize:18,flexShrink:0,color:T.text2,fontWeight:300}}>✦</div>
<div>
<div style={{fontSize:15,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>Weekly Review</div>
<div style={{fontSize:12,color:T.text3,marginTop:1}}>AI reads your week and writes a summary.</div>
</div>
<div style={{marginLeft:"auto",color:T.text3,fontSize:18}}>›</div>
</div>
<div onClick={()=>setWeeklyWrapped(true)} className="tappable" style={{...R(),gap:14,padding:"14px 18px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:18,cursor:CP,marginBottom:12,position:"relative",overflow:"hidden"}}>
<div style={{width:40,height:40,borderRadius:12,background:T.accentDim,border:`1px solid ${T.accent}44`,display:DF,alignItems:AC,justifyContent:"center",fontSize:16,flexShrink:0,color:T.accent,fontWeight:700}}>✦</div>
<div>
<div style={{fontSize:15,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>Weekly Wrapped</div>
<div style={{fontSize:12,color:T.text3,marginTop:1}}>Your week as a story.</div>
</div>
<div style={{marginLeft:"auto",color:T.text3,fontSize:18}}>›</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,gridAutoRows:"auto"}}>
{vis.map(item=>renderWidget(item))}
</div>
</div>
);
}
const nextDue=(due,freq)=>{const d=due?new Date(due+"T00:00:00"):new Date();if(freq==="daily")d.setDate(d.getDate()+1);else if(freq==="weekly")d.setDate(d.getDate()+7);else if(freq==="monthly")d.setMonth(d.getMonth()+1);return d.toISOString().split("T")[0];};
function TasksScreen({data,setData}){
const [text,setText]=useState("");
const [priority,setPriority]=useState("medium");
const [due,setDue]=useState("");
const [dueTime,setDueTime]=useState("");
const [tag,setTag]=useState("Work");
const [recurring,setRecurring]=useState("none");
const [filter,setFilter]=useState("all");
const [showForm,setShowForm]=useState(false);
const [breakingDown,setBreakingDown]=useState(null);
const [subtasks,setSubtasks]=useState({});

const add=()=>{if(!text.trim())return;setData(d=>({...d,tasks:[...d.tasks,{id:Date.now(),text:text.trim(),done:false,priority,tag,due,dueTime,recurring,lastCompleted:""}]}));setText("");setDue("");setDueTime("");setRecurring("none");setShowForm(false);};
const toggle=id=>{
const task=data.tasks.find(t=>t.id===id);
setData(d=>({...d,tasks:d.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)}));
if(task&&!task.done&&task.recurring&&task.recurring!=="none"){
setTimeout(()=>{
setData(d=>({...d,tasks:d.tasks.map(t=>{
if(t.id!==id||!t.done)return t;
const today=new Date().toISOString().split("T")[0];
const nextDate=t.due?nextDue(t.due,t.recurring):"";
return{...t,done:false,lastCompleted:today,due:nextDate};
})}));
},700);
}
};
const remove=id=>{setData(d=>({...d,tasks:d.tasks.filter(t=>t.id!==id)}));setSubtasks(s=>{const n={...s};delete n[id];return n;});};
const toggleSub=(tid,sid)=>setSubtasks(s=>({...s,[tid]:(s[tid]||[]).map(st=>st.id===sid?{...st,done:!st.done}:st)}));
const removeSub=(tid,sid)=>setSubtasks(s=>({...s,[tid]:(s[tid]||[]).filter(st=>st.id!==sid)}));
const acceptSubtasks=(tid,subs)=>{
const newTasks=subs.map(s=>({id:Date.now()+Math.random(),text:s,done:false,priority:"medium",tag:data.tasks.find(t=>t.id===tid)?.tag||"Work"}));
setData(d=>({...d,tasks:[...d.tasks,...newTasks]}));
setSubtasks(s=>{const n={...s};delete n[tid];return n;});
setBreakingDown(null);
};

const breakdown=async(task)=>{
if(breakingDown===task.id){setBreakingDown(null);setSubtasks(s=>{const n={...s};delete n[task.id];return n;});return;}
setBreakingDown(task.id);
setSubtasks(s=>({...s,[task.id]:"loading"}));
try{
const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:400,messages:[{role:"user",content:`Break this task into 3-5 clear, specific, actionable subtasks. Task: "${task.text}". Respond ONLY with a JSON array of strings, no markdown, no backticks. Example: ["Do X","Do Y","Do Z"]`}]})});
const d=await res.json();
const raw=d.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
const parsed=JSON.parse(raw);
setSubtasks(s=>({...s,[task.id]:parsed.map(st=>({id:Date.now()+Math.random(),text:st,done:false}))}));
}catch{setSubtasks(s=>({...s,[task.id]:"error"}));}
};

const filtered=data.tasks.filter(t=>filter==="all"?true:filter==="active"?!t.done:t.done);
return(
<div className="page">
<div style={{...R("space-between"),marginBottom:22}}>
<div><div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>Tasks</div><div style={{fontSize:13,color:T.text3,marginTop:3}}>{data.tasks.filter(t=>!t.done).length} remaining</div></div>
<button onClick={()=>setShowForm(v=>!v)} className="icon-btn" style={{width:42,height:42,fontSize:22}}>+</button>
</div>
{showForm&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:14}}>
<input className="inp" style={{marginBottom:12}} placeholder="What needs to be done?" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} autoFocus/>
<div style={{...R(),flexWrap:"wrap",gap:6,marginBottom:10}}>
<span style={{fontSize:11,color:T.text3,fontWeight:600,letterSpacing:".04em"}}>PRIORITY</span>
{["high","medium","low"].map(p=>(
<button key={p} className="chip" onClick={()=>setPriority(p)} style={{background:priority===p?P_C[p]+"22":undefined,color:priority===p?P_C[p]:undefined,borderColor:priority===p?P_C[p]:undefined}}>{p}</button>
))}
</div>
<div style={{...R(),flexWrap:"wrap",gap:6,marginBottom:16}}>
<span style={{fontSize:11,color:T.text3,fontWeight:600,letterSpacing:".04em"}}>TAG</span>
{["Work","Personal","Health","School"].map(tg=>(
<button key={tg} className="chip" onClick={()=>setTag(tg)} style={{background:tag===tg?(TAG_C[tg]||T.accent)+"22":undefined,color:tag===tg?TAG_C[tg]||T.accent:undefined,borderColor:tag===tg?TAG_C[tg]||T.accent:undefined}}>{tg}</button>
))}
</div>
<div style={{display:"flex",gap:8,marginBottom:12}}>
<input type="date" className="inp" style={{flex:2,colorScheme:"dark"}} value={due} onChange={e=>setDue(e.target.value)}/>
<input type="time" className="inp" style={{flex:1,colorScheme:"dark"}} value={dueTime} onChange={e=>setDueTime(e.target.value)}/>
</div>
<div style={{...R("space-between"),padding:"11px 14px",background:T.surface3,borderRadius:12,border:`1px solid ${T.border2}`,marginBottom:recurring!=="none"?10:14}}>
<span style={{fontSize:13,fontWeight:600,color:T.text2,letterSpacing:LS}}>↻ Recurring</span>
<div onClick={()=>setRecurring(r=>r==="none"?"daily":"none")} style={{width:44,height:26,borderRadius:13,background:recurring!=="none"?T.accent:T.surface1,border:`1px solid ${recurring!=="none"?T.accent:T.border2}`,cursor:CP,position:"relative",transition:"background .2s",flexShrink:0}}>
<div style={{position:"absolute",top:3,left:recurring!=="none"?21:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
</div>
</div>
{recurring!=="none"&&(
<div style={{...R(),gap:6,marginBottom:14}}>
{["daily","weekly","monthly"].map(f=>(
<button key={f} className="chip" onClick={()=>setRecurring(f)} style={{flex:1,justifyContent:"center",background:recurring===f?T.accentDim:undefined,color:recurring===f?T.accent:undefined,borderColor:recurring===f?T.accent:undefined}}>{f[0].toUpperCase()+f.slice(1)}</button>
))}
</div>
)}
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={add}>Add Task</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setShowForm(false)}>Cancel</button>
</div>
</div>
)}
<div className="seg" style={{marginBottom:16}}>
{["all","active","done"].map(f=>(
<button key={f} className={`seg-b ${filter===f?"seg-on":"seg-off"}`} onClick={()=>setFilter(f)}>{f[0].toUpperCase()+f.slice(1)}</button>
))}
</div>
<div className="card" style={{padding:"0 16px"}}>
{filtered.length===0&&<div style={{padding:"18px 0",fontSize:14,color:T.text3,textAlign:"center"}}>Nothing here</div>}
{filtered.map((t,i)=>{
const tc=TAG_C[t.tag]||T.text3;
const subs=subtasks[t.id];
const isOpen=breakingDown===t.id;
return(
<div key={t.id} style={{borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none"}}>
<div style={{display:DF,alignItems:AC,gap:12,padding:"13px 0",opacity:t.done?.4:1,transition:"opacity .2s"}}>
<div className={`chk ${t.done?"done":""}`} onClick={()=>toggle(t.id)}>{t.done&&<span style={{color:"#fff",fontSize:11,fontWeight:800,lineHeight:1}}>✓</span>}</div>
<div style={{flex:1,minWidth:0}} onClick={()=>toggle(t.id)}>
<div style={{fontSize:15,fontWeight:500,color:t.done?T.text3:T.text1,textDecoration:t.done?"line-through":"none",letterSpacing:LS,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
<div style={{...R(),gap:6,marginTop:2,alignItems:"center"}}>
<span style={{fontSize:11,fontWeight:700,color:tc,letterSpacing:".02em"}}>{t.tag.toUpperCase()}</span>
{t.recurring&&t.recurring!=="none"&&<span style={{fontSize:10,fontWeight:700,color:T.accent,letterSpacing:".03em"}}>↻ {t.recurring.toUpperCase()}</span>}
</div>
</div>
<div style={{width:6,height:6,borderRadius:"50%",background:P_C[t.priority],flexShrink:0}}/>
{!t.done&&(
<button onClick={e=>{e.stopPropagation();breakdown(t);}} style={{background:"none",border:"none",color:isOpen?T.accent:T.text3,cursor:CP,fontSize:13,padding:"0 2px",lineHeight:1,fontFamily:FI,flexShrink:0,fontWeight:700,letterSpacing:LS,transition:"color .15s"}} title="AI breakdown">✦</button>
)}
<button onClick={e=>{e.stopPropagation();remove(t.id);}} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:20,padding:"0 0 0 2px",lineHeight:1,fontFamily:FI,flexShrink:0}}>×</button>
</div>
{isOpen&&(
<div className="fadeIn" style={{paddingBottom:12,paddingLeft:34}}>
{subs==="loading"&&(
<div style={{...R(),gap:6,paddingBottom:4}}>
{[1,2,3].map(i=><div key={i} className={`d${i}`} style={{width:5,height:5,borderRadius:"50%",background:T.text3}}/>)}
<span style={{fontSize:12,color:T.text3}}>Breaking down...</span>
</div>
)}
{subs==="error"&&<div style={{fontSize:12,color:T.text3}}>Failed. Try again.</div>}
{Array.isArray(subs)&&(
<React.Fragment>
{subs.map((st,si)=>(
<div key={st.id} style={{...R(),gap:10,padding:"6px 0",borderBottom:si<subs.length-1?`1px solid ${T.border}`:"none"}}>
<div className={`chk ${st.done?"done":""}`} style={{width:18,height:18}} onClick={()=>toggleSub(t.id,st.id)}>{st.done&&<span style={{color:"#fff",fontSize:9,fontWeight:800}}>✓</span>}</div>
<div style={{flex:1,fontSize:13,color:st.done?T.text3:T.text2,textDecoration:st.done?"line-through":"none",letterSpacing:LS}}>{st.text}</div>
<button onClick={e=>{e.stopPropagation();removeSub(t.id,st.id);}} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:16,lineHeight:1,fontFamily:FI}}>×</button>
</div>
))}
<div style={{...R(),gap:8,marginTop:10}}>
<button className="btn-p" style={{flex:1,padding:"10px 0",fontSize:13,opacity:subs.length===0?.4:1}} disabled={subs.length===0} onClick={()=>acceptSubtasks(t.id,subs.map(s=>s.text))}>Add as tasks</button>
<button className="btn-s" style={{padding:"10px 14px",fontSize:13}} onClick={()=>{setBreakingDown(null);setSubtasks(s=>{const n={...s};delete n[t.id];return n;});}}>Dismiss</button>
</div>
</React.Fragment>
)}
</div>
)}
</div>
);
})}
</div>
</div>
);
}
function CalendarScreen({data,setData}){
const [cur,setCur]=useState({year:2026,month:4});
const [selectedDay,setSelectedDay]=useState(null);
const [form,setForm]=useState({title:"",date:"",time:""});
const [sf,setSf]=useState(false);
const firstDay=new Date(cur.year,cur.month,1).getDay();
const daysInMonth=new Date(cur.year,cur.month+1,0).getDate();
const cells=[...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
const getEvts=day=>{const ds=`${cur.year}-${String(cur.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;return data.events.filter(e=>e.date===ds);};
const addEvent=()=>{if(!form.title||!form.date)return;setData(d=>({...d,events:[...d.events,{id:Date.now(),title:form.title,date:form.date,time:form.time,color:T.accent}]}));setForm({title:"",date:"",time:""});setSf(false);};
const todayISO=new Date().toISOString().split("T")[0];const taskEvents=data.tasks.filter(t=>t.due&&t.due>=todayISO).map(t=>({id:"task-"+t.id,title:t.text,date:t.due,time:"",color:T.accent,isTask:true,taskId:t.id,done:t.done}));const upcoming=[...data.events,...taskEvents].filter(e=>e.date>=todayISO).sort((a,b)=>a.date.localeCompare(b.date));
return(
<div className="page">
<div style={{...R("space-between"),marginBottom:22}}>
<div><div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>Calendar</div><div style={{fontSize:13,color:T.text3,marginTop:3}}>{MONTHS[cur.month]} {cur.year}</div></div>
<div style={R()}>
<button className="icon-btn" style={{width:38,height:38,fontSize:20}} onClick={()=>setCur(c=>{const d=new Date(c.year,c.month-1);return{year:d.getFullYear(),month:d.getMonth()};})}>‹</button>
<button className="icon-btn" style={{width:38,height:38,fontSize:20}} onClick={()=>setCur(c=>{const d=new Date(c.year,c.month+1);return{year:d.getFullYear(),month:d.getMonth()};})}>›</button>
<button className="icon-btn" style={{width:38,height:38,fontSize:22}} onClick={()=>setSf(v=>!v)}>+</button>
</div>
</div>
{sf&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:14}}>
<input className="inp" style={{marginBottom:10}} placeholder="Event title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus/>
<div style={{display:"flex",gap:8,marginBottom:14}}>
<input type="date" className="inp" style={{flex:2,colorScheme:"dark"}} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
<input type="time" className="inp" style={{flex:1,colorScheme:"dark"}} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
</div>
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={addEvent}>Add Event</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setSf(false)}>Cancel</button>
</div>
</div>
)}
<div className="card" style={{padding:"16px",marginBottom:14}}>
<div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
{["S","M","T","W","T","F","S"].map((d,i)=>(
<div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:T.text3,padding:"2px 0"}}>{d}</div>
))}
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
{cells.map((day,i)=>{
if(day===null){return <div key={i}/>;}
const now=new Date();const isToday=day===now.getDate()&&cur.month===now.getMonth()&&cur.year===now.getFullYear();
const evts=getEvts(day);
return(
<div key={i} onClick={()=>setSelectedDay(selectedDay===day?null:day)} style={{aspectRatio:"1",display:DF,flexDirection:"column",alignItems:AC,justifyContent:"center",borderRadius:10,background:isToday?T.accent:selectedDay===day?T.accentDim:"transparent",position:"relative",cursor:CP,border:selectedDay===day?`1px solid ${T.accent}`:"1px solid transparent"}}>
<span style={{fontSize:14,fontWeight:isToday?700:400,color:isToday?"#fff":T.text2}}>{day}</span>
{evts.length>0&&!isToday&&<div style={{width:4,height:4,borderRadius:"50%",background:T.accent,marginTop:1}}/>}
</div>
);
})}
</div>
</div>
{selectedDay&&(()=>{const ds=`${cur.year}-${String(cur.month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`;const dayTaskEvts=data.tasks.filter(t=>t.due===ds).map(t=>({id:"task-"+t.id,title:t.text,date:t.due,time:t.dueTime||"",color:T.accent,isTask:true,taskId:t.id}));const dayEvts=[...data.events.filter(e=>e.date===ds),...dayTaskEvts];return(<div className="card scaleIn" style={{padding:"14px 16px",marginBottom:14}}><div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.accent,marginBottom:10}}>{MONTHS[cur.month].toUpperCase()} {selectedDay}</div>{dayEvts.length===0?<div style={{fontSize:13,color:T.text3}}>Nothing scheduled</div>:dayEvts.map((e,i)=>(<div key={e.id} style={{...R(),gap:10,padding:"7px 0",borderBottom:i<dayEvts.length-1?`1px solid ${T.border}`:"none"}}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.text1}}>{e.title}</div>{e.time&&<div style={{fontSize:11,color:T.text3,marginTop:1}}>{e.time}</div>}</div><button onClick={ev=>{ev.stopPropagation();if(e.isTask){setData(d=>({...d,tasks:d.tasks.filter(t=>t.id!==e.taskId)}));}else{setData(d=>({...d,events:d.events.filter(ex=>ex.id!==e.id)}));}}} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:18,fontFamily:FI}}>×</button></div>))}</div>);})()}
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:10}}>UPCOMING</div>
<div className="card" style={{padding:"0 16px"}}>
{upcoming.length===0&&<div style={{padding:"16px 0",fontSize:14,color:T.text3,textAlign:"center"}}>No events yet</div>}
{upcoming.map((e,i)=>(
<div key={e.id} style={{...R(),gap:12,padding:"13px 0",borderBottom:i<upcoming.length-1?`1px solid ${T.border}`:"none"}}>
<div style={{width:3,height:36,borderRadius:2,background:T.accent,flexShrink:0}}/>
<div style={{flex:1}}>
<div style={{fontSize:15,fontWeight:600,color:T.text1,letterSpacing:LS}}>{e.title}</div>
<div style={{fontSize:12,color:T.text3,marginTop:2}}>{e.date}{e.time?` · ${e.time}`:""}</div>
</div>
<button onClick={e2=>{e2.stopPropagation();if(e.isTask){setData(d=>({...d,tasks:d.tasks.filter(t=>t.id!==e.taskId)}));}else{setData(d=>({...d,events:d.events.filter(ev=>ev.id!==e.id)}));}}} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:20,padding:"0 0 0 8px",lineHeight:1,fontFamily:FI,flexShrink:0}}>×</button>
</div>
))}
</div>
</div>
);
}
function HealthScreen({data,setData}){
const h=data.health;
const [mode,setMode]=useState("log"); // "log" | "scan"
const [ff,setFf]=useState({name:"",calories:"",protein:"",carbs:"",fat:"",meal:"Breakfast"});
const [sff,setSff]=useState(false);
const [scanning,setScanning]=useState(false);
const [scanResult,setScanResult]=useState(null);
const [cg,setCg]=useState("");const [sg,setSg]=useState("");
const fileRef=useRef(null);
const ts=h.steps[h.steps.length-1]?.count||0;
const sp=Math.min(100,Math.round((ts/h.stepGoal)*100));
const tc=h.foodLog.reduce((s,f)=>s+f.calories,0);
const cp=h.calorieGoal>0?Math.min(100,Math.round((tc/h.calorieGoal)*100)):0;
const mx=Math.max(...h.steps.map(s=>s.count),h.stepGoal,1);
const MEALS=["Breakfast","Lunch","Dinner","Snack"];

const scanImage=async(file)=>{
if(!file||scanning)return;
setScanning(true);setScanResult(null);
const reader=new FileReader();
reader.onload=async(e)=>{
const b64=e.target.result.split(",")[1];
const mediaType=file.type||"image/jpeg";
try{
const res=await fetch("/api/claude",{
method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({
model:"claude-sonnet-4-6",max_tokens:500,
messages:[{role:"user",content:[
{type:"image",source:{type:"base64",media_type:mediaType,data:b64}},
{type:"text",text:`Analyze this food image or nutrition label. Return ONLY valid JSON (no markdown):
{"name":"food name","calories":0,"protein":0,"carbs":0,"fat":0,"sugar":0,"meal":"Breakfast","confidence":"high|medium|low","note":"brief note"}
Estimate portion size if needed. If it's a nutrition label, use the per-serving values.`}
]}]
})
});
const result=await res.json();
const text=result.content?.[0]?.text||"";
const clean=text.replace(/```json|```/g,"").trim();
const parsed=JSON.parse(clean);
setScanResult(parsed);
setFf({name:parsed.name||"",calories:String(parsed.calories||""),protein:String(parsed.protein||""),carbs:String(parsed.carbs||""),fat:String(parsed.fat||""),meal:parsed.meal||"Breakfast"});
}catch(err){setScanResult({error:"Couldn't read that image. Try a clearer photo."});}
setScanning(false);
};
reader.readAsDataURL(file);
};

const addFood=()=>{
if(!ff.name||!ff.calories)return;
const entry={id:Date.now(),name:ff.name,calories:+ff.calories,protein:+ff.protein||0,carbs:+ff.carbs||0,fat:+ff.fat||0,meal:ff.meal};
setData(d=>({...d,health:{...d.health,foodLog:[...d.health.foodLog,entry]}}));
setFf({name:"",calories:"",protein:"",carbs:"",fat:"",meal:"Breakfast"});
setSff(false);setScanResult(null);
};
const removeFood=id=>setData(d=>({...d,health:{...d.health,foodLog:d.health.foodLog.filter(f=>f.id!==id)}}));

return(
<div className="page">
<div style={{marginBottom:20}}><div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>Health</div><div style={{fontSize:13,color:T.text3,marginTop:3}}>Today's overview</div></div>
<div className="card" style={{padding:"18px",marginBottom:10}}>
<div style={{...R("space-between"),marginBottom:14}}>
<div>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:6}}>STEPS TODAY</div>
<div style={{fontSize:44,fontWeight:800,letterSpacing:"-.05em",color:T.text1,lineHeight:1}}>{ts.toLocaleString()}</div>
<div style={{fontSize:12,color:T.text3,marginTop:4}}>of {h.stepGoal.toLocaleString()} · {sp}%</div>
</div>
<div style={{position:"relative",width:68,height:68}}>
<svg width="68" height="68" style={{transform:"rotate(-90deg)"}}>
<circle cx="34" cy="34" r="28" fill="none" stroke={T.surface3} strokeWidth="6"/>
<circle cx="34" cy="34" r="28" fill="none" stroke={T.accent} strokeWidth="6" strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*(1-sp/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset .5s ease"}}/>
</svg>
<div style={{position:"absolute",inset:0,display:DF,alignItems:AC,justifyContent:"center",fontSize:13,fontWeight:800,color:T.text1}}>{sp}%</div>
</div>
</div>
<div className="pbar"><div className="pfill" style={{width:`${sp}%`,background:T.accent}}/></div>
<div style={{...R(),gap:8,marginTop:12}}>
<input className="inp" style={{flex:1,fontSize:13}} type="number" placeholder="Change step goal..." value={sg} onChange={e=>setSg(e.target.value)}/>
<button className="btn-p" style={{padding:"12px 16px",fontSize:13}} onClick={()=>{if(sg){setData(d=>({...d,health:{...d.health,stepGoal:+sg}}));setSg("");}}}>Set</button>
</div>
</div>
<div className="card" style={{padding:"16px",marginBottom:10}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:14}}>7-DAY STEPS</div>
<div style={{display:DF,alignItems:"flex-end",gap:5,height:64}}>
{h.steps.map((d,i)=>{const hp=(d.count/mx)*100;const it=i===h.steps.length-1;return(
<div key={i} style={{flex:1,display:DF,flexDirection:"column",alignItems:AC,gap:4}}>
<div style={{fontSize:9,color:T.text3}}>{d.count>=1000?(d.count/1000).toFixed(1)+"k":d.count||"–"}</div>
<div style={{width:"100%",height:`${Math.max(hp,4)}%`,minHeight:4,background:it?T.accent:T.surface3,borderRadius:"3px 3px 0 0",transition:"height .4s"}}/>
<div style={{fontSize:9,color:it?T.text1:T.text3,fontWeight:it?700:400}}>{d.date.split(" ")[1]}</div>
</div>
);})}
</div>
</div>
<div className="card" style={{padding:"18px",marginBottom:10}}>
<div style={{...R("space-between"),marginBottom:12}}>
<div>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:6}}>CALORIES</div>
<div style={{fontSize:38,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1}}>{tc}</div>
<div style={{fontSize:12,color:T.text3,marginTop:4}}>{Math.max(0,h.calorieGoal-tc)} kcal remaining</div>
</div>
<div style={{textAlign:"right"}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:6}}>GOAL</div>
<div style={{fontSize:24,fontWeight:800,letterSpacing:"-.03em",color:T.text2}}>{h.calorieGoal}</div>
</div>
</div>
<div className="pbar"><div className="pfill" style={{width:`${cp}%`,background:T.accent}}/></div>
<div style={{...R(),gap:8,marginTop:12}}>
<input className="inp" style={{flex:1,fontSize:13}} type="number" placeholder="Change calorie goal..." value={cg} onChange={e=>setCg(e.target.value)}/>
<button className="btn-p" style={{padding:"12px 16px",fontSize:13}} onClick={()=>{if(cg){setData(d=>({...d,health:{...d.health,calorieGoal:+cg}}));setCg("");}}}>Set</button>
</div>
</div>
{h.foodLog.length>0&&(()=>{
const protein=h.foodLog.reduce((s,f)=>s+(f.protein||0),0);
const carbs=h.foodLog.reduce((s,f)=>s+(f.carbs||0),0);
const fat=h.foodLog.reduce((s,f)=>s+(f.fat||0),0);
return(
<div className="card" style={{padding:"14px 18px",marginBottom:10}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:12}}>MACROS TODAY</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,textAlign:"center"}}>
{[["Protein",protein,"g"],["Carbs",carbs,"g"],["Fat",fat,"g"]].map(([label,val,unit])=>(
<div key={label}>
<div style={{fontSize:20,fontWeight:800,letterSpacing:"-.03em",color:T.text1}}>{val}</div>
<div style={{fontSize:9,color:T.text3,marginTop:2}}>{label.toUpperCase()}</div>
</div>
))}
</div>
</div>
);
})()}
<div style={{...R("space-between"),marginBottom:10}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3}}>FOOD LOG</div>
<div style={R()}>
<button onClick={()=>fileRef.current?.click()} style={{fontSize:13,fontWeight:600,color:T.text2,background:"none",border:"none",cursor:CP,fontFamily:FI,letterSpacing:LS,marginRight:6}}>⊡ Scan</button>
<button onClick={()=>setSff(v=>!v)} style={{fontSize:13,fontWeight:600,color:T.accent,background:"none",border:"none",cursor:CP,fontFamily:FI,letterSpacing:LS}}>+ Add</button>
</div>
</div>
<input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>scanImage(e.target.files[0])}/>
{scanning&&(
<div className="card" style={{padding:"20px",marginBottom:10,textAlign:"center"}}>
<div style={{width:28,height:28,marginBottom:10,border:`2px solid ${T.border2}`,borderTop:`2px solid ${T.accent}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 10px"}}/>
<div style={{fontSize:14,color:T.text2}}>Analyzing your food...</div>
<div style={{fontSize:12,color:T.text3,marginTop:4}}>Claude is reading the nutrition info</div>
</div>
)}
{(sff||scanResult)&&!scanning&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:10}}>
{scanResult&&!scanResult.error&&(
<div style={{...R(),gap:8,marginBottom:14,padding:"10px 12px",background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:10}}>
<span style={{fontSize:18}}>✦</span>
<div>
<div style={{fontSize:13,fontWeight:700,color:T.accent}}>AI detected: {scanResult.name}</div>
<div style={{fontSize:11,color:T.text3,marginTop:1}}>{scanResult.calories} kcal · P:{scanResult.protein}g C:{scanResult.carbs}g F:{scanResult.fat}g · Confidence: {scanResult.confidence}</div>
</div>
</div>
)}
{scanResult?.error&&<div style={{fontSize:13,color:T.text3,marginBottom:12,padding:"10px 12px",background:T.surface3,borderRadius:10}}>{scanResult.error}</div>}
<input className="inp" style={{marginBottom:8}} placeholder="Food name..." value={ff.name} onChange={e=>setFf(f=>({...f,name:e.target.value}))} autoFocus={!scanResult}/>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
<input className="inp" type="number" placeholder="Calories *" value={ff.calories} onChange={e=>setFf(f=>({...f,calories:e.target.value}))}/>
<input className="inp" type="number" placeholder="Protein (g)" value={ff.protein} onChange={e=>setFf(f=>({...f,protein:e.target.value}))}/>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
<input className="inp" type="number" placeholder="Carbs (g)" value={ff.carbs} onChange={e=>setFf(f=>({...f,carbs:e.target.value}))}/>
<input className="inp" type="number" placeholder="Fat (g)" value={ff.fat} onChange={e=>setFf(f=>({...f,fat:e.target.value}))}/>
</div>
<div style={{display:DF,gap:6,flexWrap:"wrap",marginBottom:14}}>
{MEALS.map(m=>(
<button key={m} className="chip" onClick={()=>setFf(f=>({...f,meal:m}))} style={{background:ff.meal===m?T.accentDim:undefined,color:ff.meal===m?T.accent:undefined,borderColor:ff.meal===m?T.accent:undefined}}>{m}</button>
))}
</div>
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={addFood}>Log Food</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>{setSff(false);setScanResult(null);}}>Cancel</button>
</div>
</div>
)}
{MEALS.map(meal=>{
const items=h.foodLog.filter(f=>f.meal===meal);if(!items.length)return null;
return(
<div key={meal} className="card" style={{padding:"14px 16px",marginBottom:8}}>
<div style={{...R("space-between"),marginBottom:10}}>
<span style={{fontSize:11,fontWeight:700,letterSpacing:".04em",color:T.accent}}>{meal.toUpperCase()}</span>
<span style={{fontSize:12,color:T.text3,fontWeight:600}}>{items.reduce((s,f)=>s+f.calories,0)} kcal</span>
</div>
{items.map((item,i)=>(
<div key={item.id} style={{...R("space-between"),padding:"8px 0",borderBottom:i<items.length-1?`1px solid ${T.border}`:"none"}}>
<div style={{flex:1}}>
<div style={{fontSize:14,color:T.text1,letterSpacing:LS}}>{item.name}</div>
{(item.protein||item.carbs||item.fat)>0&&<div style={{fontSize:10,color:T.text3,marginTop:2}}>P:{item.protein||0}g · C:{item.carbs||0}g · F:{item.fat||0}g</div>}
</div>
<div style={R()}>
<span style={{fontSize:13,fontWeight:600,color:T.text2}}>{item.calories}</span>
<button onClick={e=>{e.stopPropagation();removeFood(item.id);}} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:18,padding:"0 0 0 8px",fontFamily:FI}}>×</button>
</div>
</div>
))}
</div>
);
})}
</div>
);
}
function HabitsScreen({data,setData}){
const todayStr=new Date().toISOString().split("T")[0];
const [form,setForm]=useState({name:"",icon:"◈",notifTime:"08:00"});
const [sf,setSf]=useState(false);
const ICONS=["◈","◉","◎","◇","◆","▦","▤","✦","◐","◑","⊕","⊗","⊞","⊟","◫","▷","◸","⬡","⌘","⊹"];

const toggle=(habitId)=>{
setData(d=>({...d,habits:d.habits.map(h=>{
if(h.id!==habitId)return h;
const done=h.completedDates.includes(todayStr);
return{...h,completedDates:done?h.completedDates.filter(dd=>dd!==todayStr):[...h.completedDates,todayStr]};
})}));
};
const addHabit=()=>{
if(!form.name.trim())return;
setData(d=>({...d,habits:[...d.habits,{id:Date.now(),name:form.name,icon:form.icon,notifTime:form.notifTime,completedDates:[]}]}));
setForm({name:"",icon:"◈",notifTime:"08:00"});setSf(false);
};
const removeHabit=id=>setData(d=>({...d,habits:d.habits.filter(h=>h.id!==id)}));

const getStreak=(habit)=>{
let streak=0;
const d=new Date();
let maxIter=400;
while(maxIter-->0){
const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
if(!habit.completedDates.includes(ds))break;
streak++;d.setDate(d.getDate()-1);
}
return streak;
};
const last7=Array.from({length:7},(_,i)=>{
const d=new Date();d.setDate(d.getDate()-6+i);
return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
});

return(
<div className="page">
<div style={{...R("space-between"),marginBottom:22}}>
<div><div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>Habits</div><div style={{fontSize:13,color:T.text3,marginTop:3}}>{data.habits.filter(h=>h.completedDates.includes(todayStr)).length}/{data.habits.length} done today</div></div>
<button onClick={()=>setSf(v=>!v)} className="icon-btn" style={{width:42,height:42,fontSize:22}}>+</button>
</div>
{sf&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:14}}>
<input className="inp" style={{marginBottom:12}} placeholder="Habit name..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus/>
<div style={{fontSize:11,color:T.text3,fontWeight:600,letterSpacing:".04em",marginBottom:10}}>PICK AN ICON</div>
<div style={{display:DF,flexWrap:"wrap",gap:8,marginBottom:16}}>
{ICONS.map(ic=>(
<div key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{width:40,height:40,borderRadius:10,border:`1.5px solid ${form.icon===ic?T.accent:T.border2}`,background:form.icon===ic?T.accentDim:T.surface3,display:DF,alignItems:AC,justifyContent:"center",fontSize:20,cursor:CP,transition:"all .15s"}}>{ic}</div>
))}
</div>
<div style={{display:DF,alignItems:AC,gap:12,marginBottom:16,padding:"11px 14px",background:T.surface3,borderRadius:12,border:`1px solid ${T.border2}`}}>
<span style={{fontSize:13,color:T.text3,fontWeight:600,letterSpacing:".02em",flexShrink:0}}>◬ Remind me at</span>
<input type="time" value={form.notifTime} onChange={e=>setForm(f=>({...f,notifTime:e.target.value}))} style={{background:"transparent",border:"none",color:T.text1,fontFamily:"'Geist',sans-serif",fontSize:14,fontWeight:600,outline:"none",colorScheme:"dark",marginLeft:"auto"}}/>
</div>
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={addHabit}>Add Habit</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setSf(false)}>Cancel</button>
</div>
</div>
)}

{data.habits.map(habit=>{
const done=habit.completedDates.includes(todayStr);
const streak=getStreak(habit);
return(
<div key={habit.id} className="card" style={{padding:"16px",marginBottom:10}}>
<div style={{...R("space-between"),marginBottom:12}}>
<div style={R()}>
<span style={{fontSize:24}}>{habit.icon}</span>
<div>
<div style={{fontSize:16,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>{habit.name}</div>
<div style={{...R(),gap:8,marginTop:1}}>
<div style={{fontSize:11,color:T.text3}}>{streak > 0?`${streak} day streak`:"No streak yet"}</div>
{habit.notifTime&&<div style={{fontSize:10,color:T.text3}}>· ◬ {habit.notifTime}</div>}
</div>
</div>
</div>
<div style={R()}>
<button onClick={e=>{e.stopPropagation();removeHabit(habit.id);}} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:18,padding:0,fontFamily:FI,marginRight:8}}>×</button>
<div onClick={()=>toggle(habit.id)} style={{width:36,height:36,borderRadius:10,border:`2px solid ${done?T.accent:T.border2}`,background:done?T.accentDim:"transparent",display:DF,alignItems:AC,justifyContent:"center",cursor:CP,transition:"all .2s",fontSize:18,color:done?T.accent:T.text3}}>
{done?"✓":"○"}
</div>
</div>
</div>
<div style={{display:DF,gap:5}}>
{last7.map((ds,i)=>{
const completed=habit.completedDates.includes(ds);
const isToday=ds===todayStr;
return(
<div key={i} style={{flex:1,aspectRatio:"1",borderRadius:6,background:completed?T.accent:T.surface3,border:isToday?`1.5px solid ${T.accent}`:"1.5px solid transparent",opacity:completed?1:.4,transition:"background .2s"}}/>
);
})}
</div>
<div style={{...R("space-between"),marginTop:4}}>
{["M1","M2","M3","M4","M5","M6","7"].map((d,i)=>(
<div key={i} style={{flex:1,textAlign:"center",fontSize:8,color:T.text3}}>{last7[i].split("-")[2]}</div>
))}
</div>
</div>
);
})}
</div>
);
}
function JournalScreen({data,setData}){
const todayStr=new Date().toISOString().split("T")[0];
const [writing,setWriting]=useState(false);
const [content,setContent]=useState("");
const [loadingPrompt,setLoadingPrompt]=useState(false);
const [prompt,setPrompt]=useState("");
const todayEntry=data.journal.find(j=>j.date===todayStr);

const saveMood=(moodKey)=>{
setData(d=>{
const exists=d.journal.some(j=>j.date===todayStr);
if(exists)return{...d,journal:d.journal.map(j=>j.date===todayStr?{...j,mood:moodKey}:j)};
return{...d,journal:[...d.journal,{id:Date.now(),date:todayStr,content:"",mood:moodKey}]};
});
};
const saveEntry=()=>{
if(!content.trim())return;
setData(d=>{
const existing=d.journal.find(j=>j.date===todayStr);
return{...d,journal:[...d.journal.filter(j=>j.date!==todayStr),{id:Date.now(),date:todayStr,content:content.trim(),mood:existing?.mood||""}]};
});
setWriting(false);
};

const getPrompt=async()=>{
setLoadingPrompt(true);
try{
const res=await fetch("/api/claude",{
method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:150,messages:[{role:"user",content:"Give me one thoughtful, specific daily journal reflection prompt. Just the question, no intro. Make it introspective and meaningful. Max 20 words."}]})
});
const result=await res.json();
setPrompt(result.content?.[0]?.text?.trim()||"What made today meaningful?");
}catch{setPrompt("What made today meaningful?");}
setLoadingPrompt(false);
};

return(
<div className="page">
<div style={{...R("space-between"),marginBottom:22}}>
<div style={{fontSize:13,color:T.text3,marginTop:3}}>{new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
{!writing&&<button onClick={()=>{setWriting(true);setContent(todayEntry?.content||"");}} className="icon-btn" style={{width:42,height:42,fontSize:20}}>{todayEntry?"✎":"+"}</button>}
</div>
{!writing&&(
<React.Fragment>
<div className="card" style={{padding:"16px",marginBottom:14}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:12}}>HOW ARE YOU FEELING?</div>
<div style={{display:DF,gap:6}}>
{MOODS.map(m=>{
const sel=todayEntry?.mood===m.key;
return(
<div key={m.key} onClick={()=>saveMood(m.key)} className="tappable" style={{flex:1,display:DF,flexDirection:"column",alignItems:AC,gap:5,padding:"10px 4px",background:sel?m.color+"33":"transparent",border:`1.5px solid ${sel?m.color:T.border}`,borderRadius:12,cursor:CP,transition:"all .15s"}}>
<span style={{fontSize:20}}>{m.icon}</span>
<span style={{fontSize:9,fontWeight:700,color:sel?m.color:T.text3,letterSpacing:".03em"}}>{m.label.toUpperCase()}</span>
</div>
);
})}
</div>
</div>
{todayEntry?.content?(
<div className="card" style={{padding:"20px",marginBottom:14}}>
<div style={{...R("space-between"),marginBottom:12}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3}}>TODAY</div>
{todayEntry.mood&&<span style={{fontSize:16}}>{MOODS.find(m=>m.key===todayEntry.mood)?.icon}</span>}
</div>
<div style={{fontSize:15,lineHeight:1.8,color:T.text1,letterSpacing:LS,whiteSpace:"pre-wrap"}}>{todayEntry.content}</div>
</div>
):(
<div className="card" style={{padding:"24px",marginBottom:14,textAlign:"center",cursor:CP}} onClick={()=>setWriting(true)}>
<div style={{fontSize:32,marginBottom:10}}>✎</div>
{todayEntry?.mood&&<div style={{fontSize:14,marginBottom:8}}>{MOODS.find(m=>m.key===todayEntry.mood)?.icon} <span style={{color:T.text2,fontWeight:600}}>{MOODS.find(m=>m.key===todayEntry.mood)?.label}</span></div>}
<div style={{fontSize:15,fontWeight:600,color:T.text1}}>Write today's entry</div>
<div style={{fontSize:13,color:T.text3,marginTop:4}}>Capture your thoughts</div>
</div>
)}
<div className="card" style={{padding:"16px",marginBottom:14}}>
<div style={{...R("space-between"),marginBottom:10}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3}}>REFLECTION PROMPT</div>
<button onClick={getPrompt} style={{fontSize:12,fontWeight:600,color:T.accent,background:"none",border:"none",cursor:CP,fontFamily:FI}}>{loadingPrompt?"...":"✦ New"}</button>
</div>
<div style={{fontSize:15,color:T.text1,lineHeight:1.6,fontStyle:"italic"}}>{prompt||"Tap ✦ New for a reflection prompt from TDI"}</div>
{prompt&&<button onClick={()=>{setWriting(true);setContent(todayEntry?.content||"");}} style={{...R(),gap:6,marginTop:12,fontSize:12,fontWeight:600,color:T.accent,background:"none",border:"none",cursor:CP,fontFamily:FI}}>Write about this →</button>}
</div>
{data.journal.filter(j=>j.date!==todayStr&&(j.content||j.mood)).length>0&&(
<React.Fragment>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:10}}>PAST ENTRIES</div>
{data.journal.filter(j=>j.date!==todayStr&&(j.content||j.mood)).sort((a,b)=>b.date.localeCompare(a.date)).map((entry,i,arr)=>(
<div key={entry.id} className="card" style={{padding:"14px 16px",marginBottom:8,cursor:CP}} onClick={()=>{setContent(entry.content||"");setWriting(true);}}>
<div style={{...R("space-between"),marginBottom:6}}>
<div style={{fontSize:11,fontWeight:700,color:T.text3,letterSpacing:".04em"}}>{entry.date}</div>
{entry.mood&&<span style={{fontSize:14}}>{MOODS.find(m=>m.key===entry.mood)?.icon}</span>}
</div>
{entry.content
?<div style={{fontSize:13,color:T.text2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:LS}}>{entry.content}</div>
:<div style={{fontSize:12,color:T.text3,fontStyle:"italic"}}>Mood only</div>}
</div>
))}
</React.Fragment>
)}
</React.Fragment>
)}
{writing&&(
<div className="scaleIn">
<div style={{display:DF,gap:5,marginBottom:16}}>
{MOODS.map(m=>{
const sel=todayEntry?.mood===m.key;
return(
<div key={m.key} onClick={()=>saveMood(m.key)} className="tappable" style={{flex:1,display:DF,flexDirection:"column",alignItems:AC,gap:3,padding:"8px 4px",background:sel?m.color+"33":"transparent",border:`1.5px solid ${sel?m.color:T.border}`,borderRadius:10,cursor:CP,transition:"all .15s"}}>
<span style={{fontSize:16}}>{m.icon}</span>
<span style={{fontSize:8,fontWeight:700,color:sel?m.color:T.text3,letterSpacing:".03em"}}>{m.label.toUpperCase()}</span>
</div>
);
})}
</div>
{prompt&&<div style={{fontSize:13,color:T.text3,fontStyle:"italic",marginBottom:16,lineHeight:1.6}}>{prompt}</div>}
<textarea
value={content}
onChange={e=>setContent(e.target.value)}
placeholder="Start writing..."
autoFocus
style={{width:"100%",minHeight:280,background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:16,padding:"16px",fontSize:16,lineHeight:1.85,color:T.text1,fontFamily:"'Geist',sans-serif",outline:"none",resize:"none",letterSpacing:LS}}
/>
<div style={{...R(),gap:10,marginTop:12}}>
<button className="btn-p" style={{flex:1}} onClick={saveEntry}>Save Entry</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setWriting(false)}>Cancel</button>
</div>
</div>
)}
</div>
);
}
function FocusScreen(){
const MODES=[{label:"Focus",mins:25},{label:"Short Break",mins:5},{label:"Long Break",mins:15}];
const [modeIdx,setModeIdx]=useState(0);
const [secs,setSecs]=useState(25*60);
const [running,setRunning]=useState(false);
const [sessions,setSessions]=useState(0);
const [task,setTask]=useState("");
const intervalRef=useRef(null);
const total=MODES[modeIdx].mins*60;
const pct=(secs/total)*100;
const r=100;const circ=2*Math.PI*r;

useEffect(()=>{
if(running){
intervalRef.current=setInterval(()=>{
setSecs(s=>{
if(s<=1){
clearInterval(intervalRef.current);
setRunning(false);
if(modeIdx===0)setSessions(n=>n+1);
return 0;
}
return s-1;
});
},1000);
}else{
clearInterval(intervalRef.current);
}
return()=>clearInterval(intervalRef.current);
},[running,modeIdx]);

const selectMode=(i)=>{setModeIdx(i);setSecs(MODES[i].mins*60);setRunning(false);};
const reset=()=>{setSecs(MODES[modeIdx].mins*60);setRunning(false);};

return(
<div className="page" style={{textAlign:"center"}}>
<div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1,marginBottom:4,textAlign:"left"}}>Focus</div>
<div style={{fontSize:13,color:T.text3,marginBottom:24,textAlign:"left"}}>{sessions} session{sessions!==1?"s":""} completed</div>
<div className="seg" style={{marginBottom:32}}>
{MODES.map((m,i)=>(
<button key={i} className={`seg-b ${modeIdx===i?"seg-on":"seg-off"}`} onClick={()=>selectMode(i)}>{m.label}</button>
))}
</div>
<div style={{position:"relative",width:240,height:240,margin:"0 auto 32px"}}>
<svg width="240" height="240" style={{transform:"rotate(-90deg)"}}>
<circle cx="120" cy="120" r={r} fill="none" stroke={T.surface2} strokeWidth="10"/>
<circle cx="120" cy="120" r={r} fill="none" stroke={T.accent} strokeWidth="10"
strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
strokeLinecap="round" style={{transition:"stroke-dashoffset .8s ease"}}/>
</svg>
<div style={{position:"absolute",inset:0,display:DF,flexDirection:"column",alignItems:AC,justifyContent:"center"}}>
<div style={{fontSize:52,fontWeight:800,letterSpacing:"-.04em",color:T.text1,lineHeight:1,animation:running&&secs<=10?"timerPulse 1s ease infinite":"none"}}>{fmt(secs)}</div>
<div style={{fontSize:13,color:T.text3,marginTop:6,fontWeight:600}}>{MODES[modeIdx].label}</div>
</div>
</div>
<input className="inp" placeholder="What are you working on?" value={task} onChange={e=>setTask(e.target.value)} style={{marginBottom:20,textAlign:"center"}}/>
<div style={{...R("center"),gap:16}}>
<button onClick={reset} style={{width:52,height:52,borderRadius:"50%",background:T.surface3,border:`1px solid ${T.border2}`,cursor:CP,fontSize:20,color:T.text2,display:DF,alignItems:AC,justifyContent:"center",fontFamily:FI}}>↺</button>
<button onClick={()=>setRunning(v=>!v)} style={{width:72,height:72,borderRadius:"50%",background:running?T.surface3:T.accent,border:"none",cursor:CP,fontSize:28,color:"#fff",display:DF,alignItems:AC,justifyContent:"center",fontFamily:FI,transition:"all .2s",boxShadow:running?"none":"0 8px 24px rgba(232,135,90,.35)"}}>
{running?"⏸":"▶"}
</button>
<button onClick={()=>selectMode((modeIdx+1)%MODES.length)} style={{width:52,height:52,borderRadius:"50%",background:T.surface3,border:`1px solid ${T.border2}`,cursor:CP,fontSize:14,color:T.text2,display:DF,alignItems:AC,justifyContent:"center",fontFamily:FI,fontWeight:600}}>⏭</button>
</div>

{sessions>0&&(
<div style={{marginTop:32,padding:"14px 16px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:14}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:8}}>TODAY'S SESSIONS</div>
<div style={{display:DF,gap:8,justifyContent:"center",flexWrap:"wrap"}}>
{Array.from({length:sessions}).map((_,i)=>(
<div key={i} style={{width:32,height:32,borderRadius:8,background:T.accentDim,border:`1px solid ${T.accent}33`,display:DF,alignItems:AC,justifyContent:"center",fontSize:14,color:T.accent,fontWeight:700}}>◉</div>
))}
</div>
</div>
)}
</div>
);
}
function FinanceScreen({data,setData}){
const f=data.finance;
const [tab,setTab]=useState("budget");
const [txForm,setTxForm]=useState({desc:"",amount:"",cat:"Food"});
const [showTx,setShowTx]=useState(false);
const [catForm,setCatForm]=useState({name:"",budget:"",icon:"💰"});
const [showCat,setShowCat]=useState(false);
const [sgForm,setSgForm]=useState({name:"",target:"",saved:""});
const [showSg,setShowSg]=useState(false);
const totalSpent=f.categories.reduce((s,c)=>s+c.spent,0);
const totalBudget=f.categories.reduce((s,c)=>s+c.budget,0);
const remaining=f.monthlyIncome-totalSpent;
const spentPct=totalBudget>0?Math.min(100,Math.round((totalSpent/totalBudget)*100)):0;

const addTx=()=>{
if(!txForm.desc||!txForm.amount)return;
const amt=parseFloat(txForm.amount);
const newTx={id:Date.now(),desc:txForm.desc,amount:amt,cat:txForm.cat,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase()};
const updCats=f.categories.map(c=>c.name===txForm.cat&&txForm.cat!=="Income"?{...c,spent:Math.max(0,c.spent+Math.abs(amt))}:c);
setData(d=>({...d,finance:{...d.finance,transactions:[newTx,...d.finance.transactions],categories:updCats}}));
setTxForm({desc:"",amount:"",cat:"Food"});setShowTx(false);
};
const addCat=()=>{
if(!catForm.name||!catForm.budget||+catForm.budget<=0)return;
setData(d=>({...d,finance:{...d.finance,categories:[...d.finance.categories,{id:Date.now(),name:catForm.name,budget:+catForm.budget,spent:0,icon:catForm.icon}]}}));
setCatForm({name:"",budget:"",icon:"💰"});setShowCat(false);
};
const addSg=()=>{
if(!sgForm.name||!sgForm.target)return;
setData(d=>({...d,finance:{...d.finance,savingsGoals:[...d.finance.savingsGoals,{id:Date.now(),name:sgForm.name,target:+sgForm.target,saved:+sgForm.saved||0}]}}));
setSgForm({name:"",target:"",saved:""});setShowSg(false);
};
const addToSavings=(id,amt)=>{
setData(d=>({...d,finance:{...d.finance,savingsGoals:d.finance.savingsGoals.map(g=>g.id===id?{...g,saved:Math.min(g.target,g.saved+amt)}:g)}}));
};

return(
<div className="page">
<div style={{marginBottom:20}}><div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>Finance</div><div style={{fontSize:13,color:T.text3,marginTop:3}}>May 2026</div></div>
<div className="card" style={{padding:"18px",marginBottom:14}}>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0,textAlign:"center",marginBottom:14}}>
{[["Income","$"+f.monthlyIncome.toLocaleString()],["Spent","$"+totalSpent.toLocaleString()],["Left","$"+remaining.toLocaleString()]].map(([label,val],i)=>(
<div key={label} style={{borderRight:i<2?`1px solid ${T.border}`:"none"}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:4}}>{label}</div>
<div style={{fontSize:20,fontWeight:800,letterSpacing:"-.03em",color:i===2&&remaining<0?"#E05C5C":T.text1}}>{val}</div>
</div>
))}
</div>
<div className="pbar"><div className="pfill" style={{width:`${spentPct}%`,background:T.accent}}/></div>
<div style={{fontSize:11,color:T.text3,marginTop:5}}>{spentPct}% of monthly budget used</div>
</div>
<div className="seg" style={{marginBottom:16}}>
{["budget","savings","transactions"].map(t=>(
<button key={t} className={`seg-b ${tab===t?"seg-on":"seg-off"}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>
))}
</div>
{tab==="budget"&&(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:10}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3}}>CATEGORIES</div>
<button onClick={()=>setShowCat(v=>!v)} style={{fontSize:13,fontWeight:600,color:T.accent,background:"none",border:"none",cursor:CP,fontFamily:FI}}>+ Add</button>
</div>
{showCat&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:12}}>
<input className="inp" style={{marginBottom:8}} placeholder="Category name" value={catForm.name} onChange={e=>setCatForm(f=>({...f,name:e.target.value}))} autoFocus/>
<input className="inp" style={{marginBottom:12}} type="number" placeholder="Monthly budget ($)" value={catForm.budget} onChange={e=>setCatForm(f=>({...f,budget:e.target.value}))}/>
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={addCat}>Add Category</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setShowCat(false)}>Cancel</button>
</div>
</div>
)}
{f.categories.map((cat,i)=>{
const pct2=cat.budget>0?Math.min(100,Math.round((cat.spent/cat.budget)*100)):0;
const over=cat.spent>cat.budget;
return(
<div key={cat.id} className="card" style={{padding:"14px 16px",marginBottom:8}}>
<div style={{...R("space-between"),marginBottom:8}}>
<div style={R()}><span style={{fontSize:20,marginRight:4}}>{cat.icon}</span><span style={{fontSize:15,fontWeight:600,color:T.text1}}>{cat.name}</span></div>
<div style={{textAlign:"right"}}>
<div style={{fontSize:14,fontWeight:700,color:over?T.accent:T.text1}}>${cat.spent}<span style={{fontSize:11,color:T.text3,fontWeight:400}}> / ${cat.budget}</span></div>
</div>
</div>
<div className="pbar"><div className="pfill" style={{width:`${pct2}%`,background:over?T.accent:T.text2}}/></div>
<div style={{fontSize:10,color:T.text3,marginTop:4}}>{over?`$${cat.spent-cat.budget} over budget`:`$${cat.budget-cat.spent} remaining`}</div>
</div>
);
})}
</React.Fragment>
)}
{tab==="savings"&&(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:10}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3}}>SAVINGS GOALS</div>
<button onClick={()=>setShowSg(v=>!v)} style={{fontSize:13,fontWeight:600,color:T.accent,background:"none",border:"none",cursor:CP,fontFamily:FI}}>+ Add</button>
</div>
{showSg&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:12}}>
<input className="inp" style={{marginBottom:8}} placeholder="Goal name" value={sgForm.name} onChange={e=>setSgForm(f=>({...f,name:e.target.value}))} autoFocus/>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
<input className="inp" type="number" placeholder="Target ($)" value={sgForm.target} onChange={e=>setSgForm(f=>({...f,target:e.target.value}))}/>
<input className="inp" type="number" placeholder="Saved so far" value={sgForm.saved} onChange={e=>setSgForm(f=>({...f,saved:e.target.value}))}/>
</div>
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={addSg}>Add Goal</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setShowSg(false)}>Cancel</button>
</div>
</div>
)}
{f.savingsGoals.map(g=>{
const pct2=g.target>0?Math.min(100,Math.round((g.saved/g.target)*100)):0;
return(
<div key={g.id} className="card" style={{padding:"16px",marginBottom:10}}>
<div style={{...R("space-between"),marginBottom:4}}>
<div style={{fontSize:16,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>{g.name}</div>
<div style={{fontSize:14,fontWeight:700,color:T.accent}}>{pct2}%</div>
</div>
<div style={{fontSize:12,color:T.text3,marginBottom:10}}>${g.saved.toLocaleString()} of ${g.target.toLocaleString()}</div>
<div className="pbar" style={{marginBottom:12}}><div className="pfill" style={{width:`${pct2}%`,background:T.accent}}/></div>
<div style={R()}>
{[10,25,50,100].map(amt=>(
<button key={amt} onClick={()=>addToSavings(g.id,amt)} style={{flex:1,padding:"8px 0",background:T.surface3,border:`1px solid ${T.border2}`,borderRadius:8,cursor:CP,fontSize:12,fontWeight:600,color:T.text2,fontFamily:FI,transition:"background .15s"}}>+${amt}</button>
))}
</div>
</div>
);
})}
</React.Fragment>
)}
{tab==="transactions"&&(
<React.Fragment>
<div style={{...R("space-between"),marginBottom:10}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3}}>RECENT</div>
<button onClick={()=>setShowTx(v=>!v)} style={{fontSize:13,fontWeight:600,color:T.accent,background:"none",border:"none",cursor:CP,fontFamily:FI}}>+ Add</button>
</div>
{showTx&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:12}}>
<input className="inp" style={{marginBottom:8}} placeholder="Description" value={txForm.desc} onChange={e=>setTxForm(f=>({...f,desc:e.target.value}))} autoFocus/>
<input className="inp" style={{marginBottom:8}} type="number" placeholder="Amount (negative = expense)" value={txForm.amount} onChange={e=>setTxForm(f=>({...f,amount:e.target.value}))}/>
<div style={{display:DF,gap:6,flexWrap:"wrap",marginBottom:14}}>
{[...f.categories.map(c=>c.name),"Income"].map(cat=>(
<button key={cat} className="chip" onClick={()=>setTxForm(f=>({...f,cat}))} style={{background:txForm.cat===cat?T.accentDim:undefined,color:txForm.cat===cat?T.accent:undefined,borderColor:txForm.cat===cat?T.accent:undefined}}>{cat}</button>
))}
</div>
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={addTx}>Add</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setShowTx(false)}>Cancel</button>
</div>
</div>
)}
<div className="card" style={{padding:"0 16px"}}>
{f.transactions.length===0&&<div style={{padding:"18px 0",fontSize:14,color:T.text3,textAlign:"center"}}>No transactions yet</div>}
{f.transactions.map((tx,i)=>(
<div key={tx.id} style={{...R("space-between"),padding:"13px 0",borderBottom:i<f.transactions.length-1?`1px solid ${T.border}`:"none"}}>
<div>
<div style={{fontSize:15,fontWeight:500,color:T.text1,letterSpacing:LS}}>{tx.desc}</div>
<div style={{fontSize:11,color:T.text3,marginTop:2}}>{tx.cat} · {tx.date}</div>
</div>
<div style={{fontSize:16,fontWeight:700,color:tx.amount>0?"#5AC47B":T.text1,letterSpacing:"-.02em"}}>{tx.amount>0?"+":""}${Math.abs(tx.amount)}</div>
</div>
))}
</div>
</React.Fragment>
)}
</div>
);
}
function NotesScreen({data,setData}){
const [sel,setSel]=useState(null);
const [nt,setNt]=useState("");const [cr,setCr]=useState(false);
const [saved,setSaved]=useState(false);
const saveTimer=useRef(null);
const note=data.notes.find(n=>n.id===sel);
const create=()=>{if(!nt.trim())return;const n={id:Date.now(),title:nt,content:"",date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})};setData(d=>({...d,notes:[n,...d.notes]}));setSel(n.id);setCr(false);setNt("");};
const del=id=>{setData(d=>({...d,notes:d.notes.filter(n=>n.id!==id)}));setSel(null);};
if(sel&&note)return(
<div className="page">
<button className="back" onClick={()=>setSel(null)}>‹ Notes</button>
<div style={{...R("space-between"),marginBottom:20}}>
<div style={{fontSize:22,fontWeight:700,letterSpacing:"-.04em",color:T.text1,flex:1}}>{note.title}</div>
<button onClick={()=>del(note.id)} style={{fontSize:13,color:T.text3,background:"none",border:"none",cursor:CP,fontFamily:FI,padding:"2px 0 2px 16px",flexShrink:0}}>Delete</button>
</div>
<textarea value={note.content} onChange={e=>{setData(d=>({...d,notes:d.notes.map(n=>n.id===sel?{...n,content:e.target.value}:n)}));clearTimeout(saveTimer.current);setSaved(false);saveTimer.current=setTimeout(()=>setSaved(true),1500);}} placeholder="Start writing..." style={{width:"100%",minHeight:400,border:"none",outline:"none",resize:"none",fontSize:16,lineHeight:1.85,background:"transparent",color:T.text1,letterSpacing:LS}}/>
{saved&&<div style={{fontSize:11,color:T.accent,marginTop:8,fontWeight:600}}>Saved ✓</div>}
</div>
);
return(
<div className="page">
<div style={{...R("space-between"),marginBottom:22}}>
<div><div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>Notes</div><div style={{fontSize:13,color:T.text3,marginTop:3}}>{data.notes.length} notes</div></div>
<button className="icon-btn" style={{width:42,height:42,fontSize:22}} onClick={()=>setCr(v=>!v)}>+</button>
</div>
{cr&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:12}}>
<input className="inp" style={{marginBottom:12}} placeholder="Note title..." value={nt} onChange={e=>setNt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")create();}} autoFocus/>
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={create}>Create</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setCr(false)}>Cancel</button>
</div>
</div>
)}
<div className="card" style={{padding:"0 16px"}}>
{data.notes.map((n,i)=>(
<div key={n.id} onClick={()=>setSel(n.id)} className="tappable" style={{display:DF,alignItems:AC,gap:12,padding:"14px 0",borderBottom:i<data.notes.length-1?`1px solid ${T.border}`:"none",cursor:CP}}>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:15,fontWeight:600,color:T.text1,letterSpacing:"-.02em",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</div>
<div style={{fontSize:13,color:T.text3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.content||"Empty note"}</div>
</div>
<div style={{fontSize:11,color:T.text3,flexShrink:0}}>{n.date}</div>
</div>
))}
</div>
</div>
);
}
function GoalsScreen({data,setData}){
const [form,setForm]=useState({title:"",category:"Business",due:""});
const [sf,setSf]=useState(false);
const add=()=>{if(!form.title)return;setData(d=>({...d,goals:[...d.goals,{id:Date.now(),...form,progress:0,accountability:{enabled:false,time:"20:00"}}]}));setForm({title:"",category:"Business",due:""});setSf(false);};
const up=(id,v)=>setData(d=>{
const newGoals=d.goals.map(g=>g.id===id?{...g,progress:Math.max(0,Math.min(100,+v))}:g);
const goal=newGoals.find(g=>g.id===id);
let newNotifs=[...d.notifications];
if(+v===100&&d.notifSettings.goals){
const already=d.notifications.some(n=>n.type==="goal_complete"&&n.body?.includes(goal.title));
if(!already){
const n={id:Date.now(),type:"goal_complete",icon:"◎",title:"Goal complete",body:`You finished "${goal.title}" — well done.`,time:new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),read:false};
newNotifs=[n,...newNotifs];
if("Notification" in window&&Notification.permission==="granted")new Notification("TDI — Goal complete!",{body:n.body});
}
}
return{...d,goals:newGoals,notifications:newNotifs};
});
const rm=id=>setData(d=>({...d,goals:d.goals.filter(g=>g.id!==id)}));
const toggleAcct=(id)=>setData(d=>({...d,goals:d.goals.map(g=>g.id===id?{...g,accountability:{...(g.accountability||{}),enabled:!(g.accountability?.enabled)}}:g)}));
const setAcctTime=(id,t)=>setData(d=>({...d,goals:d.goals.map(g=>g.id===id?{...g,accountability:{...(g.accountability||{}),time:t}}:g)}));
return(
<div className="page">
<div style={{...R("space-between"),marginBottom:22}}>
<div><div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>Goals</div><div style={{fontSize:13,color:T.text3,marginTop:3}}>{data.goals.filter(g=>g.progress===100).length}/{data.goals.length} complete</div></div>
<button className="icon-btn" style={{width:42,height:42,fontSize:22}} onClick={()=>setSf(v=>!v)}>+</button>
</div>
{sf&&(
<div className="card scaleIn" style={{padding:"18px",marginBottom:14}}>
<input className="inp" style={{marginBottom:10}} placeholder="Goal title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus/>
<input className="inp" style={{marginBottom:12}} placeholder="Due date (e.g. Jun 1)" value={form.due} onChange={e=>setForm(f=>({...f,due:e.target.value}))}/>
<div style={{display:DF,gap:6,flexWrap:"wrap",marginBottom:14}}>
{Object.keys(CAT_C).map(cat=>(
<button key={cat} className="chip" onClick={()=>setForm(f=>({...f,category:cat}))} style={{background:form.category===cat?T.accentDim:undefined,color:form.category===cat?T.accent:undefined,borderColor:form.category===cat?T.accent:undefined}}>{cat}</button>
))}
</div>
<div style={R()}>
<button className="btn-p" style={{flex:1}} onClick={add}>Add Goal</button>
<button className="btn-s" style={{padding:"13px 16px"}} onClick={()=>setSf(false)}>Cancel</button>
</div>
</div>
)}
{data.goals.map(g=>(
<div key={g.id} className="card" style={{padding:"16px",marginBottom:10}}>
<div style={{...R("space-between"),marginBottom:10}}>
<span style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3}}>{g.category.toUpperCase()}</span>
<button onClick={e=>{e.stopPropagation();rm(g.id);}} style={{background:"none",border:"none",color:T.text3,cursor:CP,fontSize:18,padding:0,fontFamily:FI}}>×</button>
</div>
<div style={{fontSize:17,fontWeight:700,color:T.text1,letterSpacing:"-.02em",marginBottom:3}}>{g.title}</div>
{g.due&&<div style={{fontSize:12,color:T.text3,marginBottom:12}}>Due {g.due}</div>}
<div style={{...R("space-between"),marginBottom:8}}>
<span style={{fontSize:12,color:T.text3}}>Progress</span>
<span style={{fontSize:15,fontWeight:800,color:T.accent,letterSpacing:"-.02em"}}>{g.progress}%</span>
</div>
<div className="pbar" style={{marginBottom:10}}><div className="pfill" style={{width:`${g.progress}%`,background:T.accent}}/></div>
<input type="range" min="0" max="100" value={g.progress} onChange={e=>up(g.id,e.target.value)} style={{width:"100%"}}/>
<div style={{...R("space-between"),marginTop:12,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
<div style={{...R(),gap:8}}>
<span style={{fontSize:12,fontWeight:600,color:T.text2,letterSpacing:LS}}>Accountability</span>
{g.accountability?.enabled&&(
<input type="time" value={g.accountability?.time||"20:00"} onChange={e=>{e.stopPropagation();setAcctTime(g.id,e.target.value);}} style={{background:T.surface3,border:`1px solid ${T.border2}`,borderRadius:8,padding:"2px 8px",color:T.text1,fontSize:11,fontFamily:FI,outline:"none",colorScheme:"dark"}}/>
)}
</div>
<div onClick={e=>{e.stopPropagation();toggleAcct(g.id);}} style={{width:40,height:22,borderRadius:11,background:g.accountability?.enabled?T.accent:T.border,cursor:CP,position:"relative",transition:"background .2s",flexShrink:0}}>
<div style={{position:"absolute",top:3,left:g.accountability?.enabled?19:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
</div>
</div>
</div>
))}
</div>
);
}
function NewsScreen({news,stocks}){
const [tab,setTab]=useState("news");
const newsLoading=news.length===0;
const stocksLoading=stocks.length===0;
return(
<div className="page">
<div style={{marginBottom:20}}>
<div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>News & Markets</div>
<div style={{fontSize:13,color:T.text3,marginTop:3}}>Live · {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
</div>
<div className="seg" style={{marginBottom:20}}>
{["news","markets"].map(t=>(
<button key={t} className={`seg-b ${tab===t?"seg-on":"seg-off"}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>
))}
</div>

{tab==="news"&&(
<React.Fragment>
{newsLoading?(
<div className="card" style={{padding:"28px",textAlign:"center"}}>
<div style={{width:28,height:28,border:`2px solid ${T.border2}`,borderTop:`2px solid ${T.accent}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/>
<div style={{fontSize:14,color:T.text2}}>Fetching headlines...</div>
</div>
):news.map((n,i)=>(
<div key={i} className="card" style={{padding:"16px",marginBottom:10}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.accent,marginBottom:6}}>{n.category?.toUpperCase()||"NEWS"} · {n.source}</div>
<div style={{fontSize:15,fontWeight:600,color:T.text1,letterSpacing:"-.02em",lineHeight:1.4}}>{n.headline}</div>
</div>
))}
</React.Fragment>
)}

{tab==="markets"&&(
<React.Fragment>
{stocksLoading?(
<div className="card" style={{padding:"28px",textAlign:"center"}}>
<div style={{width:28,height:28,border:`2px solid ${T.border2}`,borderTop:`2px solid ${T.accent}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/>
<div style={{fontSize:14,color:T.text2}}>Fetching market data...</div>
</div>
):(
<React.Fragment>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:10}}>KEY INDICES & ASSETS</div>
<div className="card" style={{padding:"0 16px",marginBottom:14}}>
{stocks.map((s,i)=>(
<div key={i} style={{...R("space-between"),padding:"14px 0",borderBottom:i<stocks.length-1?`1px solid ${T.border}`:"none"}}>
<div>
<div style={{fontSize:16,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>{s.symbol}</div>
<div style={{fontSize:12,color:T.text3,marginTop:2}}>{s.name}</div>
</div>
<div style={{textAlign:"right"}}>
<div style={{fontSize:16,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>{s.price}</div>
<div style={{fontSize:12,fontWeight:700,color:s.change?.startsWith("-")?T.text3:T.accent,marginTop:2}}>{s.change}</div>
</div>
</div>
))}
</div>
<div className="card" style={{padding:"14px 16px"}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:8}}>DISCLAIMER</div>
<div style={{fontSize:12,color:T.text3,lineHeight:1.6}}>Market data is sourced live via AI web search and may be delayed. Not financial advice. Always verify with your broker before making investment decisions.</div>
</div>
</React.Fragment>
)}
</React.Fragment>
)}
</div>
);
}
function WeeklyReview({data,onClose}){
const [loading,setLoading]=useState(false);
const [review,setReview]=useState(null);
const [error,setError]=useState(null);
const scrollRef=useRef(null);

const generate=async()=>{
setLoading(true);setError(null);setReview(null);
const steps=data.health.steps;
const avgSteps=Math.round(steps.reduce((s,d)=>s+d.count,0)/steps.length);
const totalCals=data.health.foodLog.reduce((s,f)=>s+f.calories,0);
const doneTasks=data.tasks.filter(t=>t.done).length;
const totalTasks=data.tasks.length;
const habitsData=data.habits.map(h=>{
const recentDates=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().split("T")[0];});
const completedThisWeek=h.completedDates.filter(d=>recentDates.includes(d)).length;
return{name:h.name,completed:completedThisWeek,outOf:7};
});
const goalsData=data.goals.map(g=>({title:g.title,progress:g.progress,category:g.category}));
const journalEntries=data.journal.slice(0,5).map(j=>({date:j.date,content:j.content.slice(0,200)}));
const financeData={
totalBudget:data.finance.categories.reduce((s,c)=>s+c.budget,0),
totalSpent:data.finance.categories.reduce((s,c)=>s+c.spent,0),
topCategory:data.finance.categories.sort((a,b)=>b.spent-a.spent)[0]?.name,
savingsProgress:data.finance.savingsGoals.map(g=>({name:g.name,pct:g.target>0?Math.round((g.saved/g.target)*100):0})),
};
const wsDate=new Date();wsDate.setDate(wsDate.getDate()-wsDate.getDay());const weDate=new Date(wsDate);weDate.setDate(wsDate.getDate()+6);const weekRange=`${wsDate.toLocaleDateString("en-US",{month:"short",day:"numeric"})} — ${weDate.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;
const prompt=`You are TDI, a premium second-brain app. Write a concise, insightful weekly review for the user based on their data. Be direct, warm, and specific — like a brilliant friend reviewing their week with them. Use the actual numbers. No fluff. No emojis.

USER DATA (week of ${weekRange}):
- Steps: avg ${avgSteps}/day (goal: ${data.health.stepGoal}/day)
- Tasks: ${doneTasks} done out of ${totalTasks} total
- Habits this week: ${JSON.stringify(habitsData)}
- Goals: ${JSON.stringify(goalsData)}
- Finance: spent $${financeData.totalSpent} of $${financeData.totalBudget} budget, top category: ${financeData.topCategory}, savings: ${JSON.stringify(financeData.savingsProgress)}
- Journal entries: ${journalEntries.length > 0 ? JSON.stringify(journalEntries) : "none this week"}

Respond ONLY with a JSON object (no markdown, no backticks) with this exact shape:
{
  "headline": "one punchy 6-10 word sentence capturing the week",
  "score": <number 1-10 overall week score>,
  "sections": [
    {"title": "Productivity", "body": "2-3 sentences on tasks, focus, goals"},
    {"title": "Health", "body": "2-3 sentences on steps, food, habits"},
    {"title": "Finance", "body": "2-3 sentences on spending, savings"},
    {"title": "Mindset", "body": "2-3 sentences synthesizing journal + overall patterns"},
    {"title": "Next Week", "body": "3 specific, actionable priorities for next week"}
  ]
}`;
try{
const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1200,messages:[{role:"user",content:prompt}]})});
const d=await res.json();
const raw=d.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
const parsed=JSON.parse(raw);
setReview(parsed);
setTimeout(()=>scrollRef.current?.scrollTo({top:0,behavior:"smooth"}),100);
}catch(e){setError("Something went wrong. Try again.");}
setLoading(false);
};

useEffect(()=>{generate();},[]);

const scoreColor=review?review.score>=8?T.accent:review.score>=5?T.text2:T.text3:T.text3;

return(
<div style={{position:"absolute",top:"env(safe-area-inset-top)",left:0,right:0,bottom:0,background:T.bg,display:DF,flexDirection:"column",zIndex:200,animation:"slideUp .34s cubic-bezier(.16,1,.3,1) both"}}>
<div style={{...R("space-between"),padding:"16px 20px 12px",flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
<div>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:2}}>TDI INTELLIGENCE</div>
<div style={{fontSize:20,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>Weekly Review</div>
</div>
<button onClick={onClose} className="icon-btn" style={{width:36,height:36,fontSize:18,borderRadius:10}}>✕</button>
</div>
<div ref={scrollRef} style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"20px 20px 48px"}}>
{loading&&(
<div style={{display:DF,flexDirection:"column",alignItems:AC,justifyContent:"center",gap:16,paddingTop:80}}>
<div style={{width:48,height:48,borderRadius:14,background:T.accentDim,border:`1px solid ${T.accent}44`,display:DF,alignItems:AC,justifyContent:"center",fontSize:22,color:T.accent}}>✦</div>
<div style={{textAlign:"center"}}>
<div style={{fontSize:15,fontWeight:600,color:T.text1,letterSpacing:"-.01em",marginBottom:6}}>Analyzing your week</div>
<div style={{display:DF,gap:5,alignItems:AC,justifyContent:"center"}}>
{[1,2,3].map(i=><div key={i} className={`d${i}`} style={{width:6,height:6,borderRadius:"50%",background:T.text3}}/>)}
</div>
</div>
</div>
)}
{error&&(
<div style={{textAlign:"center",paddingTop:60}}>
<div style={{fontSize:14,color:T.text3,marginBottom:16}}>{error}</div>
<button className="btn-p" onClick={generate} style={{fontFamily:FI}}>Try again</button>
</div>
)}
{review&&(
<React.Fragment>
<div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"20px",marginBottom:16,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${T.accent},transparent)`}}/>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:8}}>{(()=>{const ws=new Date();ws.setDate(ws.getDate()-ws.getDay());const we=new Date(ws);we.setDate(ws.getDate()+6);return`WEEK OF ${ws.toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase()} — ${we.getDate()}`;})()}</div>
<div style={{fontSize:18,fontWeight:700,color:T.text1,letterSpacing:"-.02em",lineHeight:1.35,marginBottom:16}}>{review.headline}</div>
<div style={{...R(),gap:12}}>
<div style={{display:DF,flexDirection:"column",alignItems:AC,gap:3}}>
<div style={{fontSize:36,fontWeight:800,color:scoreColor,letterSpacing:"-.04em",lineHeight:1}}>{review.score}</div>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3}}>/10</div>
</div>
<div style={{flex:1}}>
<div style={{height:6,background:T.surface3,borderRadius:3,overflow:"hidden"}}>
<div style={{height:"100%",width:`${review.score*10}%`,background:scoreColor,borderRadius:3,transition:"width 1s cubic-bezier(.16,1,.3,1)"}}/>
</div>
<div style={{fontSize:11,color:T.text3,marginTop:5}}>Overall week score</div>
</div>
</div>
</div>
{review.sections.map((sec,i)=>(
<div key={i} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:18,padding:"16px 18px",marginBottom:10}}>
<div style={{...R(),gap:8,marginBottom:8}}>
<div style={{width:7,height:7,borderRadius:"50%",background:i===review.sections.length-1?T.accent:T.border2,flexShrink:0}}/>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:i===review.sections.length-1?T.accent:T.text3}}>{sec.title.toUpperCase()}</div>
</div>
<div style={{fontSize:14,color:T.text2,lineHeight:1.65,letterSpacing:"-.01em"}}>{sec.body}</div>
</div>
))}
<button className="btn-s" onClick={generate} style={{width:"100%",fontFamily:FI,marginTop:4}}>Regenerate</button>
</React.Fragment>
)}
</div>
</div>
);
}
function BrainDump({data,setData,onClose,go}){
const [text,setText]=useState("");
const [listening,setListening]=useState(false);
const [loading,setLoading]=useState(false);
const [result,setResult]=useState(null);
const inputRef=useRef(null);

const startVoice=()=>{
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!SR){alert("Use Chrome or Safari for voice.");return;}
const r=new SR();r.lang="en-US";r.interimResults=true;
r.onstart=()=>setListening(true);
r.onend=()=>setListening(false);
r.onresult=e=>{
const transcript=Array.from(e.results).map(r=>r[0].transcript).join("");
setText(transcript);
};
r.start();
};

const process=async()=>{
if(!text.trim()||loading)return;
setLoading(true);
const sys=`You are TDI's Brain Dump processor. The user will give you a raw unstructured stream of thoughts — anything and everything on their mind. Your job is to silently sort it all into the right places.

Extract EVERY actionable item and return ONLY valid JSON (no markdown, no explanation):
{
"actions":[
{"type":"add_task","text":"...","priority":"high|medium|low","tag":"Work|Personal|School|Health"},
{"type":"add_event","title":"...","date":"YYYY-MM-DD","time":"H:MM AM"},
{"type":"add_goal","title":"...","category":"Business|Learning|Health|Personal","due":"..."},
{"type":"add_habit","name":"...","icon":"◈"},
{"type":"add_food","name":"...","calories":0,"meal":"Breakfast|Lunch|Dinner|Snack"},
{"type":"add_transaction","desc":"...","amount":0,"cat":"Food|Transport|Entertainment|Subscriptions|Income"},
{"type":"note","title":"...","content":"..."}
],
"summary":"One sentence describing what you found and sorted."
}

Rules:
- Today is ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}.- Extract EVERYTHING — deadlines, appointments, things to buy, ideas, worries, goals, debts, habits to start
- Infer dates: "friday" = ${(()=>{const d=new Date();const diff=(5-d.getDay()+7)%7||7;d.setDate(d.getDate()+diff);return d.toISOString().split("T")[0];})()}, "next week" = ${new Date(Date.now()+7*864e5).toISOString().split("T")[0]}, "tomorrow" = ${new Date(Date.now()+864e5).toISOString().split("T")[0]}
- Infer priority: urgent/ASAP/deadline = high, someday/maybe = low, default = medium
- If something is a recurring behavior ("I want to start meditating") → add_habit
- If something is a one-off purchase or bill → add_transaction
- If something is an idea or thought with no clear action → note
- Be aggressive — extract more rather than less`;

try{
const res=await fetch("/api/claude",{
method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1500,system:sys,messages:[{role:"user",content:text}]})
});
console.log("[BrainDump] /functions/claude status:",res.status);
if(!res.ok){
const errBody=await res.text();
console.error("[BrainDump] error body:",errBody);
throw new Error(`HTTP ${res.status}: ${errBody}`);
}
const r=await res.json();
const raw=r.content?.[0]?.text||"";
const clean=raw.replace(/```json|```/g,"").trim();
const start=clean.indexOf("{");
const end=clean.lastIndexOf("}")+1;
const parsed=JSON.parse(clean.slice(start,end>start?end:undefined));
const actions=parsed.actions||[];

// Apply all actions
setData(d=>{
let nd={...d};
actions.forEach(a=>{
if(a.type==="add_task") nd={...nd,tasks:[...nd.tasks,{id:Date.now()+Math.random(),text:a.text,done:false,priority:a.priority||"medium",tag:a.tag||"Personal"}]};
else if(a.type==="add_event") nd={...nd,events:[...nd.events,{id:Date.now()+Math.random(),title:a.title,date:a.date,time:a.time||"",color:T.accent}]};
else if(a.type==="add_goal") nd={...nd,goals:[...nd.goals,{id:Date.now()+Math.random(),title:a.title,category:a.category||"Personal",due:a.due||"",progress:0}]};
else if(a.type==="add_habit") nd={...nd,habits:[...nd.habits,{id:Date.now()+Math.random(),name:a.name,icon:a.icon||"◈",notifTime:"08:00",completedDates:[]}]};
else if(a.type==="add_food") nd={...nd,health:{...nd.health,foodLog:[...nd.health.foodLog,{id:Date.now()+Math.random(),name:a.name,calories:a.calories||0,protein:0,carbs:0,fat:0,meal:a.meal||"Snack"}]}};
else if(a.type==="add_transaction") nd={...nd,finance:{...nd.finance,transactions:[{id:Date.now()+Math.random(),desc:a.desc,amount:a.amount,cat:a.cat||"Food",date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})},...nd.finance.transactions]}};
else if(a.type==="note") nd={...nd,notes:[...nd.notes,{id:Date.now()+Math.random(),title:a.title||"Note",content:a.content||"",date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}]};
});
return nd;
});

setResult({summary:parsed.summary,actions});
}catch(err){
console.error("[BrainDump] caught error:",err);
setResult({summary:`Error: ${err.message}`,actions:[]});
}
setLoading(false);
};

const typeLabels={
add_task:"Task",add_event:"Event",add_goal:"Goal",
add_habit:"Habit",add_food:"Food",add_transaction:"Transaction",note:"Note"
};
const typeIcons={
add_task:"✓",add_event:"▦",add_goal:"◎",
add_habit:"◇",add_food:"◈",add_transaction:"$",note:"✐"
};

return(
<div style={{position:"absolute",inset:0,zIndex:210,display:DF,flexDirection:"column"}}>
<div onClick={result?undefined:onClose} className="fadeIn" style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}/>
<div className="slideUp" style={{position:"relative",zIndex:1,marginTop:"auto",background:T.surface1,borderTop:`1px solid ${T.border2}`,borderRadius:"28px 28px 0 0",display:DF,flexDirection:"column",maxHeight:"92dvh"}}>

{/* Handle */}
<div style={{padding:"10px 0 0",display:DF,justifyContent:"center",flexShrink:0}}>
<div style={{width:36,height:4,background:T.border2,borderRadius:2}}/>
</div>

{!result?(
// ── INPUT MODE ──
<React.Fragment>
<div style={{padding:"16px 22px 12px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
<div style={{fontSize:20,fontWeight:800,letterSpacing:"-.04em",color:T.text1,marginBottom:4}}>Brain Dump</div>
<div style={{fontSize:13,color:T.text3}}>Say everything on your mind. Don't filter, don't organize. TDI handles it.</div>
</div>
<div style={{flex:1,overflowY:"auto",padding:"16px 22px",minHeight:0}}>
<textarea
ref={inputRef}
value={text}
onChange={e=>setText(e.target.value)}
placeholder={`Just start typing or tap the mic...\n\nExamples:\n"Need to call dentist, rent due friday, want to start meditating, I owe Jake $40, pick up groceries, deadline for report is next tuesday, been thinking about starting a podcast..."`}
autoFocus
style={{width:"100%",minHeight:200,background:"transparent",border:"none",outline:"none",resize:"none",fontSize:15,lineHeight:1.8,color:T.text1,fontFamily:"'Geist',sans-serif",letterSpacing:LS}}
/>
</div>
<div style={{padding:"12px 18px 40px",borderTop:`1px solid ${T.border}`,display:DF,gap:10,flexShrink:0}}>
<button onClick={onClose} className="btn-s" style={{padding:"12px 16px"}}>Cancel</button>
<button onClick={startVoice} style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${listening?T.accent:T.border2}`,background:listening?T.accentDim:T.surface3,cursor:CP,fontSize:18,display:DF,alignItems:AC,justifyContent:"center",flexShrink:0,color:listening?T.accent:T.text2,transition:"all .15s",fontFamily:FI}}>{listening?"●":"◎"}</button>
<button onClick={process} disabled={!text.trim()||loading} className="btn-p" style={{flex:1,opacity:(!text.trim()||loading)?.4:1,fontSize:15,letterSpacing:"-.02em"}}>
{loading?(
<div style={{...R(AC),gap:8,justifyContent:"center"}}>
<div style={{width:16,height:16,border:`2px solid rgba(255,255,255,.3)`,borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
Sorting...
</div>
):"Sort it all →"}
</button>
</div>
</React.Fragment>
):(
// ── RESULT MODE ──
<React.Fragment>
<div style={{padding:"16px 22px 12px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
<div style={{fontSize:20,fontWeight:800,letterSpacing:"-.04em",color:T.text1,marginBottom:4}}>All sorted</div>
<div style={{fontSize:13,color:T.text2,lineHeight:1.6}}>{result.summary}</div>
</div>
<div style={{flex:1,overflowY:"auto",padding:"14px 22px",minHeight:0}}>
{Object.entries(
result.actions.reduce((acc,a)=>{
const label=typeLabels[a.type]||a.type;
if(!acc[label])acc[label]=[];
acc[label].push(a);
return acc;
},{})
).map(([label,items])=>(
<div key={label} style={{marginBottom:18}}>
<div style={{...R(),gap:8,marginBottom:8}}>
<span style={{fontSize:13,color:T.accent}}>{typeIcons[items[0].type]||"◈"}</span>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3}}>{label.toUpperCase()} · {items.length}</div>
</div>
{items.map((a,i)=>(
<div key={i} style={{...R(),gap:10,padding:"9px 14px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:6}}>
<div style={{flex:1,fontSize:14,color:T.text1,letterSpacing:LS}}>
{a.text||a.title||a.name||a.desc||a.content||"—"}
</div>
{a.priority&&<div style={{fontSize:10,fontWeight:700,color:P_C[a.priority],flexShrink:0}}>{a.priority.toUpperCase()}</div>}
{a.date&&<div style={{fontSize:10,color:T.text3,flexShrink:0}}>{a.date}</div>}
{a.amount&&<div style={{fontSize:11,fontWeight:700,color:T.text2,flexShrink:0}}>${Math.abs(a.amount)}</div>}
</div>
))}
</div>
))}
{result.actions.length===0&&(
<div style={{padding:"20px 0",textAlign:AC,color:T.text3,fontSize:14}}>Nothing actionable found — try being more specific.</div>
)}
</div>
<div style={{padding:"12px 18px 40px",borderTop:`1px solid ${T.border}`,display:DF,gap:10,flexShrink:0}}>
<button onClick={()=>{setResult(null);setText("");}} className="btn-s" style={{padding:"12px 16px"}}>Dump more</button>
<button onClick={onClose} className="btn-p" style={{flex:1,fontSize:15,letterSpacing:"-.02em"}}>Done</button>
</div>
</React.Fragment>
)}
</div>
</div>
);
}
function AISheet({data,setData,onClose,go}){
const [input,setInput]=useState("");
const [msgs,setMsgs]=useState([{role:"assistant",text:"What do you need? I can add tasks, events, goals, log food, update steps, log habits, or track finances."}]);
const [loading,setLoading]=useState(false);
const [listening,setListening]=useState(false);
const bottom=useRef(null);
const inputRef=useRef(null);
useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

const startVoice=()=>{
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!SR){alert("Use Chrome or Safari for voice.");return;}
const r=new SR();r.lang="en-US";r.interimResults=false;
r.onstart=()=>setListening(true);r.onend=()=>setListening(false);
r.onresult=e=>{const t=e.results[0][0].transcript;setInput(t);setTimeout(()=>send(t),80);};
r.onerror=()=>setListening(false);r.start();
};

const send=async(ov)=>{
const text=ov||input;if(!text.trim()||loading)return;
setInput("");setLoading(true);
setMsgs(m=>[...m,{role:"user",text}]);
const todayISO=new Date().toISOString().split("T")[0];
const ctx=(()=>{
const pending=data.tasks.filter(t=>!t.done);
const overdue=pending.filter(t=>t.due&&t.due<todayISO);
const dueToday=pending.filter(t=>t.due===todayISO);
const habitLines=data.habits.map(h=>{let s=0,c=todayISO;while(h.completedDates.includes(c)){s++;const x=new Date(c);x.setDate(x.getDate()-1);c=x.toISOString().split("T")[0];}return`${h.name}: streak ${s}, ${h.completedDates.includes(todayISO)?"done today":"NOT done today"}`;});
const cats=data.finance.categories.map(c=>`${c.name} $${c.spent}/$${c.budget}`);
const sav=data.finance.savingsGoals.map(g=>`${g.name} $${g.saved}/$${g.target}`);
const txs=data.finance.transactions.slice(0,5).map(t=>`${t.desc} $${t.amount} (${t.cat})`);
const todaySteps=data.health.steps[data.health.steps.length-1]?.count||0;
const todayCal=data.health.foodLog.reduce((s,f)=>s+f.calories,0);
const todayMood=data.journal.find(j=>j.date===todayISO)?.mood||"not logged";
const recentMoods=[...data.journal].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map(j=>`${j.date}:${j.mood||"none"}`).join(" ");
const goalLines=data.goals.map(g=>`${g.title} ${g.progress}%${g.due?` due ${g.due}`:""}`);
return[
`TASKS: ${pending.length} pending, ${overdue.length} overdue${overdue.length?` (${overdue.map(t=>t.text).join(", ")})`:""}, ${dueToday.length} due today${dueToday.length?` (${dueToday.map(t=>t.text).join(", ")})` :""}`,
pending.length?`All pending: ${pending.slice(0,10).map(t=>`"${t.text}" [${t.priority}${t.tag?` ${t.tag}`:""}]`).join(", ")}`:null,
`HABITS (${data.habits.length}): ${habitLines.join(" | ")||"none set"}`,
`FINANCE: income $${data.finance.monthlyIncome}/mo | spending: ${cats.join(", ")||"no categories set"} | savings goals: ${sav.join(", ")||"none"} | recent transactions: ${txs.join(", ")||"none"}`,
`HEALTH: ${todaySteps}/${data.health.stepGoal} steps today, ${todayCal}/${data.health.calorieGoal||2000} cal today, water ${data.health.waterCount||0}/${data.health.waterGoal||8} glasses`,
`GOALS (${data.goals.length}): ${goalLines.join(" | ")||"none set"}`,
`JOURNAL: today mood=${todayMood} | last 7 days: ${recentMoods||"no entries yet"}`,
].filter(Boolean).join("\n");
})();
const sys=`You are TDI's AI assistant. Today: ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}.

USER DATA SNAPSHOT (live):
${ctx}

Use this context to give personalized, cross-domain insights — notice patterns like spending spikes on low-mood days, streaks about to break, overdue tasks piling up, or calorie goals being missed. Be specific and reference their actual data when relevant.

If the user asks a question or wants insights, reply conversationally in 1-4 sentences using their data. Only include the JSON block if you need to take an action:
\`\`\`json
{"actions":[
{"type":"add_task","text":"...","priority":"high|medium|low","tag":"Work|Personal|School|Health"},
{"type":"add_event","title":"...","date":"YYYY-MM-DD","time":"H:MM AM"},
{"type":"add_goal","title":"...","category":"Business|Learning|Health|Personal","due":"..."},
{"type":"add_food","name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"meal":"Breakfast|Lunch|Dinner|Snack"},
{"type":"update_steps","count":0},
{"type":"log_habit","name":"..."},
{"type":"add_transaction","desc":"...","amount":0,"cat":"Food|Transport|Entertainment|Subscriptions|Income"}
]}\`\`\`
Rules: school/homework→School tag, doctor/medical→Health+event, gym/workout→Health, work/meeting→Work. Omit the JSON block entirely for insight/question responses.`;
try{
const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1200,system:sys,messages:[{role:"user",content:text}]})});
const result=await res.json();
const full=result.content?.[0]?.text||"";
const msg=full.replace(/```json[\s\S]*?```/g,"").trim();
const jm=full.match(/```json([\s\S]*?)```/);
let actions=[];if(jm){try{actions=JSON.parse(jm[1]).actions||[];}catch{}}
if(actions.length>0){
setData(d=>{
let nd={...d};
actions.forEach(a=>{
if(a.type==="add_task")nd={...nd,tasks:[...nd.tasks,{id:Date.now()+Math.random(),text:a.text,done:false,priority:a.priority||"medium",tag:a.tag||"Personal"}]};
else if(a.type==="add_event")nd={...nd,events:[...nd.events,{id:Date.now()+Math.random(),title:a.title,date:a.date,time:a.time||"",color:T.accent}]};
else if(a.type==="add_goal")nd={...nd,goals:[...nd.goals,{id:Date.now()+Math.random(),title:a.title,category:a.category||"Personal",due:a.due||"",progress:0}]};
else if(a.type==="add_food")nd={...nd,health:{...nd.health,foodLog:[...nd.health.foodLog,{id:Date.now()+Math.random(),name:a.name,calories:a.calories||0,protein:a.protein||0,carbs:a.carbs||0,fat:a.fat||0,meal:a.meal||"Snack"}]}};
else if(a.type==="update_steps"){const s=[...nd.health.steps];s[s.length-1]={...s[s.length-1],count:a.count};nd={...nd,health:{...nd.health,steps:s}};}
else if(a.type==="log_habit"){const todayStr=new Date().toISOString().split("T")[0];nd={...nd,habits:nd.habits.map(h=>h.name.toLowerCase().includes(a.name.toLowerCase())?{...h,completedDates:[...new Set([...h.completedDates,todayStr])]}:h)};}
else if(a.type==="add_transaction"){nd={...nd,finance:{...nd.finance,transactions:[{id:Date.now()+Math.random(),desc:a.desc,amount:a.amount,cat:a.cat||"Food",date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase()},...nd.finance.transactions]}};}
});
return nd;
});
const types=actions.map(a=>a.type);
if(types.includes("add_task"))go("tasks");
else if(types.includes("add_event"))go("calendar");
else if(types.includes("add_goal"))go("goals");
else if(types.includes("add_food")||types.includes("update_steps"))go("health");
else if(types.includes("log_habit"))go("habits");
else if(types.includes("add_transaction"))go("finance");
}
setMsgs(m=>[...m,{role:"assistant",text:msg||"Done!",actions}]);
}catch{setMsgs(m=>[...m,{role:"assistant",text:"Something went wrong. Try again."}]);}
setLoading(false);
};

return(
<div style={{position:"absolute",inset:0,zIndex:200,display:DF,flexDirection:"column",justifyContent:"flex-end"}}>
<div onClick={onClose} className="fadeIn" style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}/>
<div className="slideUp sheet" style={{position:"relative",zIndex:1,height:"70%",display:DF,flexDirection:"column"}}>
<div style={{padding:"10px 0 0",display:DF,justifyContent:"center",flexShrink:0}}>
<div style={{width:36,height:4,background:T.border2,borderRadius:2}}/>
</div>
<div style={{...R("space-between"),padding:"14px 20px 13px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
<div style={R()}>
<div style={{width:34,height:34,borderRadius:10,background:T.accentDim,border:`1px solid ${T.accent}33`,display:DF,alignItems:AC,justifyContent:"center",fontSize:16,color:T.accent,flexShrink:0}}>✦</div>
<div><div style={{fontSize:15,fontWeight:700,color:T.text1,letterSpacing:"-.02em"}}>TDI Assistant</div><div style={{fontSize:11,color:T.text3,marginTop:1}}>Powered by Claude</div></div>
</div>
<button onClick={onClose} style={{background:T.surface3,border:`1px solid ${T.border2}`,borderRadius:"50%",width:30,height:30,cursor:CP,color:T.text3,display:DF,alignItems:AC,justifyContent:"center",fontFamily:FI,fontSize:16}}>×</button>
</div>
<div style={{flex:1,overflowY:"auto",padding:"14px 18px",display:DF,flexDirection:"column",gap:8,minHeight:0}}>
{msgs.map((m,i)=>(
<div key={i} style={{display:DF,justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
<div style={{maxWidth:"82%",padding:"11px 15px",borderRadius:18,fontSize:14,lineHeight:1.65,letterSpacing:LS,background:m.role==="user"?T.accent:T.surface2,color:m.role==="user"?"#fff":T.text1,border:`1px solid ${m.role==="user"?"transparent":T.border}`,borderBottomRightRadius:m.role==="user"?4:18,borderBottomLeftRadius:m.role==="assistant"?4:18}}>
{m.text}
{m.actions?.length>0&&(
<div style={{marginTop:8,display:DF,flexWrap:"wrap",gap:4}}>
{m.actions.map((a,j)=>(
<span key={j} style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(255,255,255,.15)",fontWeight:700,letterSpacing:".02em"}}>
{a.type==="add_task"?"✓ TASK":a.type==="add_event"?"▦ EVENT":a.type==="add_goal"?"◎ GOAL":a.type==="add_food"?"◈ FOOD":a.type==="log_habit"?"◇ HABIT":a.type==="add_transaction"?"$ TX":"◈ STEPS"}
</span>
))}
</div>
)}
</div>
</div>
))}
{loading&&(
<div style={{display:DF}}>
<div style={{padding:"12px 16px",borderRadius:18,background:T.surface2,border:`1px solid ${T.border}`,display:DF,gap:5,alignItems:AC,borderBottomLeftRadius:4}}>
{[1,2,3].map(i=><div key={i} className={`d${i}`} style={{width:6,height:6,borderRadius:"50%",background:T.text3}}/>)}
</div>
</div>
)}
<div ref={bottom}/>
</div>
<div style={{padding:"10px 16px 36px",borderTop:`1px solid ${T.border}`,display:DF,gap:8,alignItems:AC,flexShrink:0}}>
<input ref={inputRef} style={{flex:1,background:T.surface3,border:`1px solid ${T.border2}`,borderRadius:24,padding:"11px 18px",fontSize:14,fontFamily:"'Geist',sans-serif",color:T.text1,outline:"none",letterSpacing:LS}} placeholder="Add anything..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!loading){e.preventDefault();send();}}} disabled={loading}/>
<button onClick={startVoice} disabled={loading} style={{width:42,height:42,borderRadius:"50%",border:`1px solid ${listening?T.accent:T.border2}`,background:listening?T.accentDim:T.surface3,cursor:CP,fontSize:16,display:DF,alignItems:AC,justifyContent:"center",flexShrink:0,color:listening?T.accent:T.text3,transition:"all .15s",fontFamily:FI}}>{listening?"●":"🎤"}</button>
<button onClick={()=>send()} disabled={loading||!input.trim()} style={{width:42,height:42,borderRadius:"50%",border:"none",background:(!input.trim()||loading)?T.surface3:T.accent,cursor:CP,fontSize:18,display:DF,alignItems:AC,justifyContent:"center",flexShrink:0,color:(!input.trim()||loading)?T.text3:"#fff",transition:"all .15s",fontFamily:FI,fontWeight:700}}>↑</button>
</div>
</div>
</div>
);
}
function WWCountUp({target,prefix,suffix,duration}){
prefix=prefix||"";suffix=suffix||"";duration=duration||1500;
const [val,setVal]=useState(0);
const rafRef=useRef(null);
useEffect(()=>{
let start=null;
const tick=(ts)=>{
if(start===null)start=ts;
const t=Math.min((ts-start)/duration,1);
const ease=1-Math.pow(1-t,3);
setVal(Math.round(ease*target));
if(t<1)rafRef.current=requestAnimationFrame(tick);
};
rafRef.current=requestAnimationFrame(tick);
return()=>cancelAnimationFrame(rafRef.current);
},[target,duration]);
return React.createElement("span",null,prefix+val.toLocaleString()+suffix);
}
function WeeklyWrapped({data,onClose}){
const [card,setCard]=useState(0);
const [shareToast,setShareToast]=useState(false);
const [finBarW,setFinBarW]=useState(0);
const timerRef=useRef(null);
const NC=6;

const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;});
const rangeStart=new Date(last7[0]+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
const rangeEnd=new Date(last7[6]+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
const dateRange=`${rangeStart} – ${rangeEnd}`;

const doneTasks=data.tasks.filter(t=>t.done).length;
const pendingTasks=data.tasks.filter(t=>!t.done).length;
const totalTasks=data.tasks.length;

const gs=(h)=>{let s=0;const d=new Date();let mi=400;while(mi-->0){const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;if(!h.completedDates.includes(ds))break;s++;d.setDate(d.getDate()-1);}return s;};
const topHabits=[...data.habits].map(h=>({...h,streak:gs(h)})).sort((a,b)=>b.streak-a.streak).slice(0,3);
const topStreak=topHabits[0]?.streak||0;

const weekMoods=last7.map(ds=>{const e=data.journal.find(j=>j.date===ds);return e?.mood||null;});
const WW_MC={great:"#E8875A",good:"#C4956A",okay:"#888888",bad:"#555555",terrible:"#333333"};
const moodCounts={};weekMoods.filter(Boolean).forEach(m=>{moodCounts[m]=(moodCounts[m]||0)+1;});
const topMood=Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;

const DSH=["Su","Mo","Tu","We","Th","Fr","Sa"];
const l7d=last7.map(ds=>{const d=new Date(ds+"T00:00:00");return{ds,lbl:DSH[d.getDay()]};});

const wkDates=last7.map(ds=>{const d=new Date(ds+"T00:00:00");return d.toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase();});
const wkTxs=data.finance.transactions.filter(tx=>wkDates.includes(tx.date));
const wkSpent=wkTxs.filter(tx=>tx.amount<0).reduce((s,tx)=>s+Math.abs(tx.amount),0);
const totBudget=data.finance.categories.reduce((s,c)=>s+c.budget,0);
const totSpent=data.finance.categories.reduce((s,c)=>s+c.spent,0);
const budgPct=totBudget>0?Math.min(100,Math.round((totSpent/totBudget)*100)):0;
const budgLeft=Math.max(0,totBudget-totSpent);
const goalsAvg=data.goals.length>0?Math.round(data.goals.reduce((s,g)=>s+g.progress,0)/data.goals.length):0;

const restart=useCallback(()=>{
clearInterval(timerRef.current);
timerRef.current=setInterval(()=>setCard(c=>c<NC-1?c+1:c),4000);
},[]);
useEffect(()=>{restart();return()=>clearInterval(timerRef.current);},[restart]);
useEffect(()=>{
if(card===4){const t=setTimeout(()=>setFinBarW(budgPct),200);return()=>clearTimeout(t);}
setFinBarW(0);
},[card,budgPct]);
const tap=()=>{if(card<NC-1){clearInterval(timerRef.current);setCard(c=>c+1);timerRef.current=setInterval(()=>setCard(c=>c<NC-1?c+1:c),4000);}};

const WWANIM=`@keyframes wwSlide{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes wwFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes wwPop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}@keyframes wwProg{from{width:0%}to{width:100%}}@keyframes wwPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes wwRow{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}`;

return(
<div style={{position:"absolute",inset:0,zIndex:200,background:"#1A1A1B",display:DF,alignItems:AC,justifyContent:"center"}}>
<style>{WWANIM}</style>
<div style={{width:"100%",maxWidth:430,height:"100%",display:DF,flexDirection:"column",position:"relative"}} onClick={tap}>
<div style={{display:DF,gap:3,padding:"calc(env(safe-area-inset-top,0px) + 14px) 16px 0",position:"absolute",top:0,left:0,right:0,zIndex:3,pointerEvents:"none"}}>
{Array.from({length:NC}).map((_,i)=>(
<div key={i} style={{flex:1,height:2,background:"rgba(255,255,255,.2)",borderRadius:1,overflow:"hidden"}}>
{i<card&&<div style={{height:"100%",width:"100%",background:"rgba(255,255,255,.75)"}}/>}
{i===card&&<div key={`p${card}`} style={{height:"100%",background:"rgba(255,255,255,.75)",animation:"wwProg 4s linear forwards"}}/>}
</div>
))}
</div>
<button onClick={e=>{e.stopPropagation();onClose();}} style={{position:"absolute",top:"calc(env(safe-area-inset-top,0px) + 20px)",right:16,zIndex:4,background:"rgba(255,255,255,.1)",border:"none",borderRadius:"50%",width:32,height:32,display:DF,alignItems:AC,justifyContent:"center",cursor:CP,color:T.text1,fontSize:18,fontFamily:FI}}>×</button>
{card===0&&(
<div key={0} style={{flex:1,display:DF,flexDirection:"column",justifyContent:"center",padding:"72px 36px 48px",animation:"wwSlide 400ms ease-out forwards"}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",color:T.text3,marginBottom:28}}>THIS WEEK</div>
<div style={{fontSize:64,fontWeight:800,letterSpacing:"-.05em",color:T.text1,lineHeight:.92}}>Your Week</div>
<div style={{fontSize:64,fontWeight:800,letterSpacing:"-.05em",color:T.accent,lineHeight:1,marginBottom:32}}>Wrapped</div>
<div style={{fontSize:16,color:T.text3,animation:"wwFade 400ms 300ms ease-out both"}}>{dateRange}</div>
</div>
)}
{card===1&&(
<div key={1} style={{flex:1,display:DF,flexDirection:"column",justifyContent:"center",padding:"72px 36px 48px",animation:"wwSlide 400ms ease-out forwards"}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",color:T.text3,marginBottom:20}}>TASKS</div>
<div style={{fontSize:22,fontWeight:700,color:T.text1,letterSpacing:"-.03em",marginBottom:20}}>You crushed it</div>
<div style={{fontSize:96,fontWeight:800,letterSpacing:"-.06em",color:T.accent,lineHeight:1,marginBottom:8}}><WWCountUp target={doneTasks} duration={1500}/></div>
<div style={{fontSize:20,fontWeight:600,color:T.text2,letterSpacing:"-.02em",marginBottom:28}}>tasks completed</div>
<div style={{fontSize:14,color:T.text3,animation:"wwFade 400ms 600ms ease-out both"}}>{totalTasks} created · {pendingTasks} still open</div>
</div>
)}
{card===2&&(
<div key={2} style={{flex:1,display:DF,flexDirection:"column",justifyContent:"flex-start",padding:"80px 36px 32px",overflowY:"auto",animation:"wwSlide 400ms ease-out forwards"}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",color:T.text3,marginBottom:16}}>HABITS</div>
<div style={{fontSize:22,fontWeight:700,color:T.text1,letterSpacing:"-.03em",marginBottom:28}}>Staying consistent</div>
{topHabits.length===0
?<div style={{fontSize:15,color:T.text3}}>No habits tracked yet</div>
:topHabits.map((h,i)=>(
<div key={h.id} style={{marginBottom:24,animation:"wwRow 400ms ease-out both",animationDelay:`${i*150}ms`}}>
<div style={{...R("space-between"),marginBottom:8}}>
<div style={{fontSize:16,fontWeight:600,color:T.text1,letterSpacing:"-.01em",flex:1,marginRight:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</div>
<div style={{fontSize:24,fontWeight:800,letterSpacing:"-.03em",color:T.accent,flexShrink:0}}><WWCountUp target={h.streak} duration={1000}/><span style={{fontSize:11,color:T.text3,fontWeight:600}}> days</span></div>
</div>
<div style={{display:DF,gap:4}}>
{l7d.map(({ds,lbl},di)=>{
const done=h.completedDates.includes(ds);
return(
<div key={di} style={{flex:1,display:DF,flexDirection:"column",alignItems:AC,gap:3}}>
<div style={{width:"100%",aspectRatio:"1",borderRadius:4,background:done?T.accent:"rgba(255,255,255,.06)",animation:done?`wwPop 300ms ${di*40}ms ease-out both`:"none"}}/>
<div style={{fontSize:8,color:T.text3,fontWeight:600}}>{lbl}</div>
</div>
);
})}
</div>
</div>
))
}
</div>
)}
{card===3&&(
<div key={3} style={{flex:1,display:DF,flexDirection:"column",justifyContent:"center",padding:"72px 36px 48px",animation:"wwSlide 400ms ease-out forwards"}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",color:T.text3,marginBottom:20}}>MOOD</div>
<div style={{fontSize:22,fontWeight:700,color:T.text1,letterSpacing:"-.03em",marginBottom:32}}>Your vibe this week</div>
<div style={{display:DF,gap:8,marginBottom:32}}>
{l7d.map(({ds,lbl},i)=>{
const mk=weekMoods[i];
const col=mk?WW_MC[mk]:"#2A2A2C";
return(
<div key={i} style={{flex:1,display:DF,flexDirection:"column",alignItems:AC,gap:6}}>
<div style={{width:"100%",aspectRatio:"1",borderRadius:"50%",background:col,animation:`wwPop 300ms ${i*60}ms ease-out both`}}/>
<div style={{fontSize:9,color:T.text3,fontWeight:600}}>{lbl}</div>
</div>
);
})}
</div>
{topMood?(
<div style={{animation:"wwFade 400ms 500ms ease-out both"}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:10}}>MOST COMMON</div>
<div style={{fontSize:42,fontWeight:800,letterSpacing:"-.04em",color:WW_MC[topMood]||T.text1}}>{topMood.charAt(0).toUpperCase()+topMood.slice(1)}</div>
</div>
):(
<div style={{fontSize:14,color:T.text3}}>No journal entries this week</div>
)}
</div>
)}
{card===4&&(
<div key={4} style={{flex:1,display:DF,flexDirection:"column",justifyContent:"center",padding:"72px 36px 48px",animation:"wwSlide 400ms ease-out forwards"}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",color:T.text3,marginBottom:20}}>FINANCE</div>
<div style={{fontSize:22,fontWeight:700,color:T.text1,letterSpacing:"-.03em",marginBottom:24}}>Money moves</div>
<div style={{fontSize:80,fontWeight:800,letterSpacing:"-.06em",color:T.accent,lineHeight:1,marginBottom:6}}>$<WWCountUp target={Math.round(wkSpent)} duration={1500}/></div>
<div style={{fontSize:16,color:T.text3,marginBottom:32}}>spent this week</div>
<div style={{marginBottom:24}}>
<div style={{...R("space-between"),marginBottom:8}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:T.text3}}>MONTHLY BUDGET</div>
<div style={{fontSize:12,fontWeight:700,color:T.text2}}>{budgPct}%</div>
</div>
<div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden"}}>
<div style={{height:"100%",background:T.accent,borderRadius:3,width:`${finBarW}%`,transition:"width 1.2s cubic-bezier(.16,1,.3,1)"}}/>
</div>
<div style={{fontSize:11,color:T.text3,marginTop:6}}>${budgLeft.toLocaleString()} remaining</div>
</div>
<div style={{fontSize:13,color:T.text3,animation:"wwFade 400ms 700ms ease-out both"}}>{wkTxs.length} transaction{wkTxs.length!==1?"s":""} this week</div>
</div>
)}
{card===5&&(
<div key={5} style={{flex:1,display:DF,flexDirection:"column",justifyContent:"center",padding:"72px 36px 48px",background:"radial-gradient(ellipse at 50% 30%, #2A2A2C 0%, #1A1A1B 65%)",animation:"wwSlide 400ms ease-out forwards"}}>
<div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",color:T.text3,marginBottom:16}}>THAT'S A WRAP</div>
<div style={{fontSize:38,fontWeight:800,letterSpacing:"-.05em",color:T.text1,lineHeight:1.1,marginBottom:32}}>That's your week.</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:28}}>
{[["Tasks ✓",`${doneTasks} done`],["Top Streak",`${topStreak} days`],["Mood",topMood?topMood.charAt(0).toUpperCase()+topMood.slice(1):"—"],["$ Spent",`$${Math.round(wkSpent)}`]].map(([label,val],i)=>(
<div key={i} style={{padding:"14px 16px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,animation:"wwFade 400ms ease-out both",animationDelay:`${i*80}ms`}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:6}}>{label.toUpperCase()}</div>
<div style={{fontSize:22,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>{val}</div>
</div>
))}
<div style={{gridColumn:"span 2",padding:"14px 16px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,animation:"wwFade 400ms 320ms ease-out both"}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".06em",color:T.text3,marginBottom:6}}>GOALS</div>
<div style={{fontSize:22,fontWeight:800,letterSpacing:"-.04em",color:T.text1}}>{goalsAvg}%</div>
</div>
</div>
<button onClick={e=>{e.stopPropagation();setShareToast(true);setTimeout(()=>setShareToast(false),3000);}} style={{width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:14,padding:"16px",fontSize:15,fontWeight:700,letterSpacing:"-.02em",cursor:CP,fontFamily:FI,animation:"wwPulse 600ms 1.5s ease-in-out both"}}>Screenshot & Share  ✦</button>
{shareToast&&(
<div style={{marginTop:14,padding:"12px 16px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,fontSize:13,color:T.text2,textAlign:"center",animation:"wwFade 200ms ease-out both"}}>Screenshot saved! Share on Instagram</div>
)}
</div>
)}
</div>
</div>
);
}
