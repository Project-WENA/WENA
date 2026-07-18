const { requireSession } = require('../lib/session');
const { getFile } = require('../lib/github');
const { parseFrontmatter } = require('../lib/frontmatter');

module.exports = async (req, res) => {
  if (!requireSession(req)) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }
  const path = req.query.path;
  if (!path || !path.startsWith('content/blog/') || !path.endsWith('.md')) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  try {
    const file = await getFile(path);
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const { data, body } = parseFrontmatter(file.content);
    const dateOnly = data.date ? String(data.date).slice(0, 10) : '';
    res.status(200).json({
      path,
      title: data.title || '',
      date: dateOnly,
      image: data.image || '',
      description: data.description || '',
      content: body
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
