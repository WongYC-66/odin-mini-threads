const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('express-async-handler');

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