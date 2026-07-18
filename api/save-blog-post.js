const { requireSession } = require('../lib/session');
const { putFile } = require('../lib/github');
const { buildFrontmatter } = require('../lib/frontmatter');

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
  const { title, date, image, description, content, path: existingPath } = body || {};

  if (!title || !content) {
    res.status(400).json({ error: 'Title and body are required' });
    return;
  }

  const isoDate = date ? new Date(date) : new Date();
  let path = existingPath;

  if (!path) {
    const yyyy = isoDate.getFullYear();
    const mm = String(isoDate.getMonth() + 1).padStart(2, '0');
    const dd = String(isoDate.getDate()).padStart(2, '0');
    const slug = slugify(title);
    path = `content/blog/${yyyy}-${mm}-${dd}-${slug}.md`;
  } else if (!path.startsWith('content/blog/') || !path.endsWith('.md')) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }

  const fileContent = buildFrontmatter(
    { title, date: isoDate.toISOString(), image, description },
    content
  );

  try {
    await putFile(
      path,
      fileContent,
      existingPath ? `Update blog post: ${title}` : `Add blog post: ${title}`
    );
    res.status(200).json({ ok: true, path });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
