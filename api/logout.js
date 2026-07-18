module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', 'wena_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure');
  res.status(200).json({ ok: true });
};
