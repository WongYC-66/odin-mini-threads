const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('express-async-handler');


// for next render static outputs only
exports.get_posts = asyncHandler(async (req, res) => {

    const { username, password } = req.body;
    console.log({username, password})

    // Check if password matches confirmPassword
    if (username != "next" || password !== process.env.NEXT_PASSWORD) {
        return res.status(400).json({ error: 'Next username or password do not match' });
    }

    const allPosts = await prisma.post.findMany({
        include: {
            author: true
        }
    })

    const data = allPosts.map(({ id, author }) => {
        return { username: `@${author.username}`, id : String(id) }
    })
    console.log({data})

    res.json({
        data
    });
});

// for next render static outputs only
exports.get_users = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    console.log({username, password})

    // Check if password matches confirmPassword
    if (username != "next" || password !== process.env.NEXT_PASSWORD) {
        return res.status(400).json({ error: 'Next username or password do not match' });
    }

    const allUsers = await prisma.user.findMany()

    const data = allUsers.map(({ username }) => {
        return { username: `@${username}` }
    })

    console.log({data})

    res.json({
        data
    });
});