import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const JWT_SECRET = config.jwtSecret;

export const authenticate = (req, res, next) => {
  try {
    // First try HTTP-only cookie
    let token = req.cookies?.token;

    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;

      if (
        authHeader &&
        authHeader.startsWith('Bearer ')
      ) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {
    console.error(
      'Authentication error:',
      err.message
    );

    return res.status(401).json({
      error: 'Invalid or expired authentication token',
    });
  }
};