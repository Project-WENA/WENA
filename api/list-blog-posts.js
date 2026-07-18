const { requireSession } = require('../lib/session');
const { listDir, getFile } = require('../lib/github');
const { parseFrontmatter } = require('../lib/frontmatter');

module.exports = async (req, res) => {
  if (!requireSession(req)) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }
  try {
    const files = await listDir('content/blog');
    const posts = [];
    for (const f of files) {
      if (!f.name.endsWith('.md')) continue;
      const file = await getFile(f.path);
      if (!file) continue;
      const { data } = parseFrontmatter(file.content);
      posts.push({
        path: f.path,
        title: data.title || f.name,
        date: data.date || ''
      });
    }
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json({ posts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
