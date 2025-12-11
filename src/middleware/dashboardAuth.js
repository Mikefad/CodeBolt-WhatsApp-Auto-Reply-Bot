function createDashboardAuth({ username = 'admin', password }) {
  if (!username || !password) {
    throw new Error('Dashboard credentials must be configured.');
  }

  function requireAuth(req, res, next) {
    if (req.session?.isDashboardUser) {
      return next();
    }
    return res.redirect('/dashboard/login');
  }

  function logout(req) {
    if (req.session) {
      req.session.isDashboardUser = false;
      req.session.user = null;
    }
  }

  function authenticate(providedUser, providedPassword) {
    return providedUser === username && providedPassword === password;
  }

  return {
    requireAuth,
    authenticate,
    logout,
  };
}

module.exports = { createDashboardAuth };
