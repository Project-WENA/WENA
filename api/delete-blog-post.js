const { requireSession } = require('../lib/session');
const { deleteFile } = require('../lib/github');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireSession(req)) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { path } = body || {};
  if (!path || !path.startsWith('content/blog/') || !path.endsWith('.md')) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }

  try {
    await deleteFile(path, `Delete blog post: ${path}`);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
