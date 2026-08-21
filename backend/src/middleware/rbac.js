/**
 * Role-Based Access Control (RBAC) Middleware
 * @param {Array<string>|string} allowedRoles
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated access.'
      });
    }

    // Super admin bypasses all role checks
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of roles: ${roles.join(', ')}`
    });
  };
};

module.exports = { requireRole };
