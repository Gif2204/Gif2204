import { db } from 'hatchable';

export const access = 'user';
export const methods = ['GET', 'POST'];

const EMPTY = { plots: [], tx: [] };

export default async function (req, res) {
  const userId = String(req.user.id);
  if (req.method === 'GET') {
    const result = await db.query('SELECT data, updated_at FROM farm_data WHERE user_id = $1', [userId]);
    if (!result.rows.length) return res.json({ data: EMPTY, updated_at: null });
    return res.json({ data: result.rows[0].data, updated_at: result.rows[0].updated_at });
  }

  const incoming = req.body && req.body.data;
  if (!incoming || !Array.isArray(incoming.plots) || !Array.isArray(incoming.tx)) {
    return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
  }
  if (incoming.plots.length > 500 || incoming.tx.length > 20000) {
    return res.status(413).json({ error: 'ข้อมูลมีจำนวนมากเกินกำหนด' });
  }
  const clean = {
    plots: incoming.plots.map(p => ({
      id: Number(p.id), name: String(p.name || '').slice(0, 160),
      area: Math.max(0, Number(p.area) || 0), cycle: String(p.cycle || '').slice(0, 80)
    })),
    tx: incoming.tx.map(t => ({
      id: Number(t.id), plotId: Number(t.plotId), date: String(t.date || '').slice(0, 10),
      type: t.type === 'income' ? 'income' : 'expense',
      cat: String(t.cat || '').slice(0, 100), detail: String(t.detail || '').slice(0, 500),
      amount: Math.max(0, Number(t.amount) || 0), person: String(t.person || '').slice(0, 160),
      qty: Math.max(0, Number(t.qty) || 0), unit: String(t.unit || '').slice(0, 60),
      note: String(t.note || '').slice(0, 1000)
    }))
  };
  const result = await db.query(
    'INSERT INTO farm_data (user_id, data, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now() RETURNING updated_at',
    [userId, JSON.stringify(clean)]
  );
  return res.json({ ok: true, updated_at: result.rows[0].updated_at });
}