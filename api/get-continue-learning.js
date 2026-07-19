const { requireSession } = require('../lib/session');
const { getFile } = require('../lib/github');

module.exports = async (req, res) => {
  if (!requireSession(req)) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }
  try {
    const file = await getFile('content/continue-learning.json');
    const data = file ? JSON.parse(file.content) : { left: { youtube_url: '' }, center: { youtube_url: '' }, right: { youtube_url: '' } };
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
