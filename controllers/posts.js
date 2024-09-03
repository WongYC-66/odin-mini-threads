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

// Update a post
exports.update_post = asyncHandler(async (req, res) => {
    const { content, postId } = req.body; // Extract content from request body
    const userId = Number(req.user.id); // Get the ID of the authenticated user

    // Validate request data
    if (!content || !postId) {
        return res.status(400).json({ message: 'Content and postId are required' });
    }

    // Fetch the existing post
    const post = await prisma.post.findUnique({
        where: { id: Number(postId) }
    });

    // Check if the post exists
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the authenticated user is the author of the post
    if (post.authorId !== userId) {
        return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    // Update the post
    const updatedPost = await prisma.post.update({
        where: { id: Number(postId) },
        data: { content },
    });

    // Send the response
    res.status(200).json({
        message: 'Post updated successfully',
        post: updatedPost
    });
});
