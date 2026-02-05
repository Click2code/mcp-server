/**
 * Auth Routes
 * POST /api/v1/auth/login
 * POST /api/v1/auth/logout
 * GET  /api/v1/auth/me
 */

import { Router } from 'express';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = Router();

// Demo user accounts
const USERS = [
  { id: '1', username: 'admin', password: 'admin123', name: 'Dr. Sarah Johnson', role: 'Medical Director', avatar: 'SJ' },
  { id: '2', username: 'nurse', password: 'nurse123', name: 'Nurse Emily Chen', role: 'Clinical Reviewer', avatar: 'EC' },
  { id: '3', username: 'analyst', password: 'analyst123', name: 'Mike Thompson', role: 'Claims Analyst', avatar: 'MT' },
];

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /auth/me
router.get('/me', verifyToken, (req, res) => {
  const user = USERS.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
  });
});

export default router;
