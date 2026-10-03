import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'securedocs_sih_2026_super_secret_jwt_key_987654321';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required', error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication required', error: 'Invalid or expired token' });
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.',
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is ${req.user?.role || 'Guest'}.`,
      });
    }
    next();
  };
}
