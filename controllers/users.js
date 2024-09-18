const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const JWT_SECRET = process.env.JWT_SECRET;

// Sign-up controller
exports.sign_up_post = asyncHandler(async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // Check if password matches confirmPassword
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if the username is already taken
    const existingUser = await prisma.user.findUnique({
        where: { username },
    });
    
    if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
        },
    });

    // Automatically follow user self , create blank profile
    await prisma.user.update({
        where: { id: user.id },
        data: {
            following: {
                connect: { id: user.id },
            },
            userProfile: {
                create: {
                    firstName: '',
                    lastName: '',
                    bio: 'the bio is empty, write something here ...',
                    photoURL: '',
                }
            }
        }
    })

    // Automatically log in user after registration
    const payload = { id: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.json({
        id: user.id,
        token: `${token}`,
    });
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
        res.json({
            id: user.id,
            token: `${token}`,
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Follow controller (protected route)
exports.follow_post = asyncHandler(async (req, res) => {
    const userId = Number(req.user.id); // Get the ID of the authenticated user
    const followId = Number(req.body.followId); // ID of the user to follow

    const userToFollow = await prisma.user.findUnique({
        where: { id: followId },
    });

    if (!userToFollow) {
        return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            following: {
                connect: { id: followId },
            },
        },
    });

    res.status(200).json({ message: 'User followed successfully' });
});

// Unfollow controller (protected route)
exports.unfollow_post = asyncHandler(async (req, res) => {
    const userId = Number(req.user.id); // Get the ID of the authenticated user
    const unfollowId = Number(req.body.unfollowId); // ID of the user to unfollow

    if (userId === unfollowId) {
        return res.status(400).json({ message: 'Cannot unfollow yourself' });
    }

    const userToUnfollow = await prisma.user.findUnique({
        where: { id: unfollowId },
    });

    if (!userToUnfollow) {
        return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            following: {
                disconnect: { id: unfollowId },
            },
        },
    });

    res.status(200).json({ message: 'User unfollowed successfully' });
});
