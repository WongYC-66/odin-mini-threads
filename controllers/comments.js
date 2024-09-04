const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('express-async-handler');

// Get a comment by ID
exports.get_comment = asyncHandler(async (req, res) => {
    const postId = Number(req.body.postId); // Extract commentId from query parameters

    // Validate request data
    if (!postId) {
        return res.status(400).json({ message: 'postId is required' });
    }

    // Retrieve the comment
    const comment = await prisma.comment.findMany({
        where: { postId: postId },
        include: {
            author: true // Include the related author/user data if needed
        },
        orderBy: { timestamp: 'desc' }
    });

    // Send the response
    res.status(200).json({
        message: 'Comment retrieved successfully',
        comment
    });
});

// Create a new comment
exports.create_comment = asyncHandler(async (req, res) => {
    const postId = Number(req.body.postId); // Extract postId and content from request body
    const { content } = req.body; // Extract postId and content from request body
    const userId = Number(req.user.id); // Get the ID of the authenticated user

    // Validate request data
    if (!postId || !content) {
        return res.status(400).json({ message: 'PostId and content are required' });
    }

    // Check if the post exists
    const post = await prisma.post.findUnique({
        where: { id: postId }
    });

    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    // Create the comment
    const comment = await prisma.comment.create({
        data: {
            content,
            postId: postId,
            authorId: userId,
        }
    });

    // Send the response
    res.status(201).json({
        message: 'Comment created successfully',
        comment
    });
});

// Update a comment by ID
exports.update_comment = asyncHandler(async (req, res) => {
    const commentId = Number(req.body.commentId); // Extract commentId from request body
    const newContent = req.body.content; // Extract new content from request body
    const userId = Number(req.user.id); // Extract the ID of the authenticated user

    // Validate request data
    if (!commentId || !newContent) {
        return res.status(400).json({ message: 'CommentId and content are required' });
    }

    // Retrieve the comment
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
            author: true // Include the author data for authorization check
        }
    });

    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the authenticated user is the author of the comment
    if (comment.author.id !== userId) {
        return res.status(403).json({ message: 'Forbidden: You are not allowed to update this comment' });
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content: newContent }
    });

    // Send the response
    res.status(200).json({
        message: 'Comment updated successfully',
        comment: updatedComment
    });
});