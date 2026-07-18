const GITHUB_API = 'https://api.github.com';

function cfg() {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO env vars');
  }
  return {
    token: GITHUB_TOKEN,
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH || 'main'
  };
}

async function getFile(path) {
  const { token, owner, repo, branch } = cfg();
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: { Authorization: `token ${token}`, 'User-Agent': 'wena-admin' } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    sha: data.sha,
    content: Buffer.from(data.content, 'base64').toString('utf-8')
  };
}

async function putFile(path, contentString, message) {
  const { token, owner, repo, branch } = cfg();
  const existing = await getFile(path);
  const body = {
    message,
    content: Buffer.from(contentString, 'utf-8').toString('base64'),
    branch
  };
  if (existing) body.sha = existing.sha;

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'wena-admin',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
  return res.json();
}

module.exports = { getFile, putFile };
