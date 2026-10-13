// Netlify Function: tiny JSON store backed by Neon (serverless Postgres).
// Reads are public; admin writes require the ADMIN_PASSWORD token; bids are validated here.
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
const ADMIN = process.env.ADMIN_PASSWORD || '';

const H = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
const ok  = (b) => ({ statusCode: 200, headers: H, body: JSON.stringify(b) });
const err = (c, b) => ({ statusCode: c, headers: H, body: JSON.stringify(b) });

async function readKey(key){ const r = await sql`select value from kv where key=${key}`; return r[0] ? r[0].value : null; }
async function writeKey(key, value){ await sql`insert into kv(key,value) values(${key}, ${JSON.stringify(value)}::jsonb) on conflict(key) do update set value=excluded.value, updated_at=now()`; }

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
    const path = (event.path || '').replace(/.*\/api/, '');   // '', '/all', '/set', '/bid', '/verify'

    if (event.httpMethod === 'GET') {
      if (path === '/all') {
        const keys = event.queryStringParameters && event.queryStringParameters.keys;
        let rows;
        if (keys) { const list = keys.split(',').map(s => s.trim()).filter(Boolean); rows = await sql`select key, value from kv where key = any(${list})`; }
        else { rows = await sql`select key, value from kv`; }
        const o = {}; rows.forEach(r => { o[r.key] = r.value; }); return ok(o);
      }
      const key = event.queryStringParameters && event.queryStringParameters.key;
      if (!key) return err(400, { error: 'key required' });
      return ok({ value: await readKey(key) });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (path === '/verify') return ok({ ok: !!ADMIN && body.token === ADMIN });

      if (path === '/bid') {
        const { boat, bid } = body;
        if (!boat || !bid || !(bid.amount > 0) || !bid.name || !bid.phone) return err(400, { error: 'bad' });
        const auction = (await readKey('auction')) || {};
        const a = auction[boat] || {};
        if (a.sale) return err(409, { error: 'sold' });
        const cur = a.high || 0;
        if (bid.amount <= cur) return err(409, { error: 'low', current: cur });
        const hist = a.history || [];
        auction[boat] = { ...a, high: bid.amount, name: bid.name, phone: bid.phone, member: !!bid.member, acct: bid.acct || '', consent: !!bid.consent, history: [...hist, { amount: bid.amount, name: bid.name, phone: bid.phone, ts: Date.now() }] };
        await writeKey('auction', auction);
        return ok({ ok: true });
      }

      if (path === '/set') {
        if (!ADMIN || body.token !== ADMIN) return err(401, { error: 'unauthorized' });
        if (!body.key) return err(400, { error: 'key required' });
        await writeKey(body.key, body.value);
        return ok({ ok: true });
      }
    }
    return err(404, { error: 'not found' });
  } catch (e) {
    return err(500, { error: String(e && e.message || e) });
  }
};
