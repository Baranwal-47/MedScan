// End-to-end demo: scan a real prescription image -> match medicines ->
// cart -> order -> Stripe test payment -> webhook -> order marked paid.
//
// Usage:  node scripts/e2e-demo.mjs <prescription-image> [api-base]
//         node scripts/e2e-demo.mjs rx.jpg http://localhost:5001/api
//
// Needs mongodb_backend/.env (Stripe + demo user creds must be valid).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const IMG = process.argv[2];
const BASE = (process.argv[3] || 'http://localhost:5001/api').replace(/\/+$/, '');
if (!IMG || !fs.existsSync(IMG)) {
  console.error('Usage: node scripts/e2e-demo.mjs <prescription-image> [api-base]');
  process.exit(1);
}

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split('\n')
    .map(l => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2].trim()])
);
const DEMO_USER = { email: process.env.DEMO_EMAIL || 'brolysensei282@gmail.com', password: process.env.DEMO_PASSWORD || 'Pass@123' };

const step = (n, ok, detail) => console.log(`${ok ? 'PASS' : 'FAIL'} | ${n}${detail ? ' | ' + detail : ''}`);

// 1. login
const login = await (await fetch(`${BASE}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(DEMO_USER)
})).json();
const token = login.token;
step('login', !!token);
const H = { Authorization: `Bearer ${token}` };
const HJ = { ...H, 'Content-Type': 'application/json' };

// 2. scan the prescription (Gemini vision -> catalogue matching)
const form = new FormData();
form.append('image', new Blob([fs.readFileSync(IMG)], { type: 'image/jpeg' }), path.basename(IMG));
const t0 = Date.now();
const scanRes = await fetch(`${BASE}/prescriptions/scan`, { method: 'POST', headers: H, body: form });
const scan = (await scanRes.json()).data || {};
step('scan', scanRes.status === 201, `engine=${scan.ocrEngine} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
for (const m of scan.matches || []) console.log(`       matched   ${m.medicine.name}  <- "${m.query}"`);
for (const u of scan.unmatched || []) console.log(`       not in catalogue: ${u}`);

// 3. cart + order with the prescription attached
await fetch(`${BASE}/cart/clear`, { method: 'DELETE', headers: H }).catch(() => {});
const medId = (scan.matches || []).find(m => m.medicine.price)?.medicine?._id;
const add = await (await fetch(`${BASE}/cart/add`, { method: 'POST', headers: HJ, body: JSON.stringify({ medicineId: medId, quantity: 1 }) })).json();
step('cart add', !!add.success, `total=INR ${add.data?.totalAmount}`);

const order = (await (await fetch(`${BASE}/orders/create`, {
  method: 'POST', headers: HJ,
  body: JSON.stringify({
    shippingAddress: { name: 'Demo User', phone: '9999999999', address: '42 Demo Lane', city: 'Jabalpur', state: 'MP', zipCode: '482001' },
    paymentMethod: 'card', doctorName: 'Dr. Demo', doctorLicense: 'MCI-00000',
    prescriptionId: scan.prescriptionId
  })
})).json()).data;
step('order create', !!order, `#${order?.orderNumber} status=${order?.status} prescription=${order?.prescription ? 'attached' : 'missing'}`);

// 4. Stripe: payment intent -> confirm with test card
const pi = (await (await fetch(`${BASE}/orders/stripe/create-payment-intent`, {
  method: 'POST', headers: HJ, body: JSON.stringify({ amount: order.totalAmount, orderId: order._id })
})).json()).data;
const piId = pi.clientSecret.split('_secret')[0];
step('payment intent', !!pi.clientSecret, piId);

const confirm = await (await fetch(`https://api.stripe.com/v1/payment_intents/${piId}/confirm`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'payment_method=pm_card_visa'
})).json();
step('stripe confirm', confirm.status === 'succeeded', `status=${confirm.status}`);

// 5. webhook (signed with STRIPE_WEBHOOK_SECRET; in production Stripe sends this)
const event = JSON.stringify({
  id: 'evt_demo', object: 'event', type: 'payment_intent.succeeded',
  data: { object: { id: piId, object: 'payment_intent', metadata: { orderId: order._id } } }
});
const ts = Math.floor(Date.now() / 1000);
const sig = crypto.createHmac('sha256', env.STRIPE_WEBHOOK_SECRET).update(`${ts}.${event}`).digest('hex');
const wh = await fetch(`${BASE}/orders/stripe/webhook`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': `t=${ts},v1=${sig}` }, body: event
});
step('webhook', wh.ok, `HTTP ${wh.status}`);

// 6. verify the order flipped to paid
const check = (await (await fetch(`${BASE}/orders/${order._id}`, { headers: HJ })).json()).data;
step('order paid', check?.paymentStatus === 'completed', `paymentStatus=${check?.paymentStatus} status=${check?.status}`);
