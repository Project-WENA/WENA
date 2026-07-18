function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const yaml = match[1];
  const body = match[2].replace(/^\n/, '');
  const data = {};
  yaml.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  });
  return { data, body };
}

function buildFrontmatter(data, body) {
  const lines = ['---'];
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (k === 'date') {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: "${String(v).replace(/"/g, '\\"')}"`);
    }
  });
  lines.push('---', '');
  return lines.join('\n') + '\n' + body + '\n';
}

module.exports = { parseFrontmatter, buildFrontmatter };
