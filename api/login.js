const { sign } = require('../lib/session');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { password } = body || {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Wrong password' });
    return;
  }

  const eightHours = 1000 * 60 * 60 * 8;
  const token = sign({ exp: Date.now() + eightHours }, process.env.SESSION_SECRET);

  res.setHeader(
    'Set-Cookie',
    `wena_session=${token}; HttpOnly; Path=/; Max-Age=${eightHours / 1000}; SameSite=Strict; Secure`
  );
  res.status(200).json({ ok: true });
};
