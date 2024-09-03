const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const JWT_SECRET = process.env.JWT_SECRET;

// get all posts (protected route)
// exports.get_post = asyncHandler(async (req, res) => {

// });

// Create a new post
exports.create_post = asyncHandler(async (req, res) => {
    const { content } = req.body; // Extract content from request body
    const userId = Number(req.user.id); // Get the ID of the authenticated user

    // Validate request data
    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    // Create a new post
    const post = await prisma.post.create({
        data: {
            content,
            authorId: userId, // Connect the post to the authenticated user
        },
    });

    // Send the response
    res.status(201).json({
        message: 'Post created successfully',
        post
    });
});
