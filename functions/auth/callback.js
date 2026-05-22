export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const params = new URLSearchParams();
  if (code) params.set("code", code);
  if (state) params.set("state", state);

  return Response.redirect(`https://livewithsage.app/?${params.toString()}`, 302);
}
