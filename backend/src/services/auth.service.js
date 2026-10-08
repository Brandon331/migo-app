import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = (plain) => bcrypt.hash(plain, 10);

export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

export const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  });

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
