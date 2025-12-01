// middleware/auth.js

// Only allow if logged in
function ensureAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect("/auth/login");
}

// Optional: only allow guests (not logged in)
function ensureGuest(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect("/"); // already logged in
  }
  return next();
}

module.exports = { ensureAuth, ensureGuest };
