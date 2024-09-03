const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const JWT_SECRET = process.env.JWT_SECRET;

// get all posts (protected route)
exports.get_post = asyncHandler(async (req, res) => {
    const userId = Number(req.user.id); // Get the ID of the authenticated user

    // Retrieve the list of users that the authenticated user is following
    const followingUsers = await prisma.user.findUnique({
        where: { id: userId },
        include: { following: true }, // Include the list of users that the user is following
    });

    // Extract the IDs of the followed users
    const followedUserIds = followingUsers.following.map(user => user.id);

    // Fetch posts from the users being followed
    const posts = await prisma.post.findMany({
        where: {
            authorId: { in: followedUserIds }, // Filter posts where the author is in the list of followed users
        },
        include: {
            author: true, // Include author details if needed
            likedBy: true, // Include users who liked the post if needed
            commments: true, // Include comments if needed
        },
        orderBy: {
            timestamp: 'desc', // Order posts by timestamp in descending order
        },
    });

    // Send the response
    res.status(200).json({ posts });
});

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
