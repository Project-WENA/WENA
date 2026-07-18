const { requireSession } = require('../lib/session');
const { putFile } = require('../lib/github');

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
  const { leftUrl, rightUrl } = body || {};

  const data = {
    left: { youtube_url: leftUrl || '' },
    right: { youtube_url: rightUrl || '' }
  };

  try {
    await putFile(
      'content/continue-learning.json',
      JSON.stringify(data, null, 2),
      'Update Continue Learning videos via admin panel'
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
