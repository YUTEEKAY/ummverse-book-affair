import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const ALLOWED = new Set(['premium_monthly', 'premium_yearly']);
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const { priceId, environment } = await req.json();
    if (!ALLOWED.has(priceId)) throw new Error('Unknown price');
    const env: PaddleEnv = environment === 'live' ? 'live' : 'sandbox';
    const res = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceId)}`);
    const data = await res.json();
    if (!data.data?.length) throw new Error('Price not found');
    return new Response(JSON.stringify({ paddleId: data.data[0].id }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
