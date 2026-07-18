const { requireSession } = require('../lib/session');
const { putFile } = require('../lib/github');

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeYamlString(str) {
  return String(str || '').replace(/"/g, '\\"');
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
  const { title, date, image, description, content } = body || {};

  if (!title || !content) {
    res.status(400).json({ error: 'Title and body are required' });
    return;
  }

  const isoDate = date ? new Date(date) : new Date();
  const yyyy = isoDate.getFullYear();
  const mm = String(isoDate.getMonth() + 1).padStart(2, '0');
  const dd = String(isoDate.getDate()).padStart(2, '0');
  const slug = slugify(title);
  const path = `content/blog/${yyyy}-${mm}-${dd}-${slug}.md`;

  const frontmatter = [
    '---',
    `title: "${escapeYamlString(title)}"`,
    `date: ${isoDate.toISOString()}`,
    image ? `image: ${image}` : null,
    `description: "${escapeYamlString(description)}"`,
    '---',
    ''
  ].filter(Boolean).join('\n');

  const fileContent = frontmatter + '\n' + content + '\n';

  try {
    await putFile(path, fileContent, `Add blog post: ${title}`);
    res.status(200).json({ ok: true, path });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
