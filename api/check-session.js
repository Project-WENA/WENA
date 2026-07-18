const { requireSession } = require('../lib/session');

module.exports = async (req, res) => {
  res.status(200).json({ loggedIn: requireSession(req) });
};
