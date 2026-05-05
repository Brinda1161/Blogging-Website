const { ROLES } = require('../config/constants');

function requireAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    // Fallback: check X-User-Id header sent by frontend
    const userId = req.headers['x-user-id'];
    const username = req.headers['x-username'];
    const role = req.headers['x-user-role'];
    if (userId && username) {
        req.session.user = { id: userId, username, role: role || 'user' };
        return next();
    }
    return res.status(401).json({ error: "Authentication required" });
}

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
}

function optionalAuth(req, res, next) {
    if (req.session.user) {
        req.user = req.session.user;
    }
    next();
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.role !== role) {
            return res.status(403).json({ error: ` ${role} access required` });
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requireAdmin,
    optionalAuth,
    requireRole
};