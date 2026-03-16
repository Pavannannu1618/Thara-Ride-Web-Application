const authorize = (...roles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, error: 'Not authenticated' });

  const userRole = req.user.role;

  if (!roles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      error:   `Access denied. Required: [${roles.join(', ')}]. Your role: ${userRole}`,
    });
  }

  next();
};

module.exports = { authorize };