import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signUserToken(user) {
  return jwt.sign(
    { sub: user.id, authProvider: user.auth_provider },
    env.jwtSecret,
    { expiresIn: '30d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret);
    req.user = { id: payload.sub, authProvider: payload.authProvider };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
