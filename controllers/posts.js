const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('express-async-handler');

// get all posts (protected route)
exports.get_post = asyncHandler(async (req, res) => {
    console.log("getting posts")
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
            comments: true, // Include comments if needed
        },
        orderBy: {
            timestamp: 'desc', // Order posts by timestamp in descending order
        },
    });

    // Send the response
    res.status(200).json({ posts });
});

// Create a new post (protected route)
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

// Update a post (protected route)
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


// Delete a post (protected route)
exports.delete_post = asyncHandler(async (req, res) => {
    const postId = Number(req.body.postId); // Extract content from request body
    const userId = Number(req.user.id); // Get the ID of the authenticated user

    // Validate request data
    if (!postId) {
        return res.status(400).json({ message: 'PostId are required' });
    }

    // Fetch the existing post
    const post = await prisma.post.findUnique({
        where: { id: postId }
    });

    // Check if the post exists
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the authenticated user is the author of the post
    if (post.authorId !== userId) {
        return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    // Delete the post
    await prisma.post.delete({
        where: { id: Number(postId) }
    });

    // Send the response
    res.status(200).json({
        message: 'Post deleted successfully',
    });
});

// Like or unlike a post (protected route)
exports.like_unlike_post = asyncHandler(async (req, res) => {
    const postId = Number(req.body.postId); // Extract postId and like from request body
    const like = Boolean(req.body.like); // Extract postId and like from request body
    const userId = Number(req.user.id); // Get the ID of the authenticated user

    // Validate request data
    if (!postId || req.body.like === undefined) {
        return res.status(400).json({ message: 'PostId and like status are required' });
    }

    // Check if the post exists
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { likedBy: true } // Include likedBy to check if user already liked the post
    });

    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = post.likedBy.some(user => user.id === userId);

    if (like) {
        // Like the post
        if (alreadyLiked) {
            return res.status(400).json({ message: 'Post already liked' });
        }

        await prisma.post.update({
            where: { id: postId },
            data: {
                likedBy: {
                    connect: { id: userId }
                }
            }
        });

        return res.status(200).json({ message: 'Post liked successfully' });
    } else {
        // Unlike the post
        if (!alreadyLiked) {
            return res.status(400).json({ message: 'Post not liked by this user' });
        }

        await prisma.post.update({
            where: { id: postId },
            data: {
                likedBy: {
                    disconnect: { id: userId }
                }
            }
        });

        return res.status(200).json({ message: 'Post unliked successfully' });
    }
});