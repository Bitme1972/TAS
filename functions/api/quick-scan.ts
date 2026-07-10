export async function onRequestPost(context: { request: Request }) {
  const payload = await context.request.json().catch(() => ({}));
  return new Response(JSON.stringify({
    product: 'AuditPol Telemetry Assurance Studio',
    version: 'v0.3-full-tas-web-studio',
    mode: 'browser-first-preview',
    note: 'The public web studio uses integrated baseline data. Production processing and retention controls must be explicitly implemented before real uploads.',
    received: Boolean(payload.auditpolText)
  }, null, 2), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
