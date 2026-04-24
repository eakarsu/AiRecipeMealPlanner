const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const isOwner = (modelGetter) => {
  return async (req, res, next) => {
    try {
      const item = await modelGetter(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      if (item.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to access this resource' });
      }
      req.resource = item;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

module.exports = { checkRole, isOwner };
