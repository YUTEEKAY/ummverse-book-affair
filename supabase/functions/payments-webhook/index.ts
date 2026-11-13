import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

let _sb: ReturnType<typeof createClient> | null = null;
const sb = () => (_sb ??= createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!));

async function created(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) { console.error('No userId in customData'); return; }
  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) { console.warn('Skipping subscription: missing importMeta.externalId'); return; }
  await sb().from('subscriptions').upsert({
    user_id: userId, paddle_subscription_id: id, paddle_customer_id: customerId,
    product_id: productId, price_id: priceId, status,
    current_period_start: currentBillingPeriod?.startsAt, current_period_end: currentBillingPeriod?.endsAt,
    environment: env, updated_at: new Date().toISOString(),
  }, { onConflict: 'paddle_subscription_id' });
}
async function updated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange } = data;
  await sb().from('subscriptions').update({
    status, current_period_start: currentBillingPeriod?.startsAt, current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === 'cancel', updated_at: new Date().toISOString(),
  }).eq('paddle_subscription_id', id).eq('environment', env);
}
async function canceled(data: any, env: PaddleEnv) {
  await sb().from('subscriptions').update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', data.id).eq('environment', env);
}
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const env = (new URL(req.url).searchParams.get('env') === 'live' ? 'live' : 'sandbox') as PaddleEnv;
  try {
    const event = await verifyWebhook(req, env);
    switch (event.eventType) {
      case EventName.SubscriptionCreated: await created(event.data, env); break;
      case EventName.SubscriptionUpdated: await updated(event.data, env); break;
      case EventName.SubscriptionCanceled: await canceled(event.data, env); break;
      default: console.log('Unhandled event:', event.eventType);
    }
    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});
