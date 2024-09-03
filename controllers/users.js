const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const JWT_SECRET = process.env.JWT_SECRET;

// Sign-up controller
exports.sign_up_post = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });
  // Automatically log in user after registration
  const payload = { id: user.id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token: `Bearer ${token}` });
});

// Login controller
exports.login_post = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    const payload = { id: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: `Bearer ${token}` });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Profile controller (protected route)
exports.profile_get = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
