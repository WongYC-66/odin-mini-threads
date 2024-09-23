const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('express-async-handler');

// Get all user profiles (protected route)
exports.get_profiles = asyncHandler(async (req, res) => {
    // Fetch all profiles from the database
    const profiles = await prisma.profile.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    _count: {
                        select: {
                            followedBy: true, // Get the count of users following this user
                        },
                    },
                },
            }
        },
        orderBy: { firstName: 'asc' },
    });

    // Also sent user curren followings username
    let { following: myFollowings } = await prisma.user.findUnique({
        where: { id: Number(req.user.id) },
        select: {
            following: {
                select: {
                    username: true,
                },
            },
        }
    });

    myFollowings = myFollowings.map(({ username }) => username)

    // Send the response
    res.status(200).json({
        message: 'Profiles retrieved successfully',
        profiles,
        myFollowings
    });
});

// Get one user profile by userId (protected route)
exports.get_one_profile = asyncHandler(async (req, res) => {
    const { username } = req.params
    // Fetch one profile from the database
    const profile = await prisma.user.findUnique({
        where: { username: username },
        select: {
            id: true,
            username: true,
            _count: {
                select: {
                    followedBy: true,   // Get the count of users following this user
                    following: true,    // Get the count of users this user is following
                },
            },
            userProfile: true,
        },
    });

    // Send the response
    res.status(200).json({
        message: 'Profiles retrieved successfully',
        profile,
    });
});

// Update user profile (protected route)
exports.update_profile = asyncHandler(async (req, res) => {
    const userId = Number(req.user.id); // Assuming passport sets req.user
    const { firstName, lastName, bio, photoURL } = req.body;

    // Update the user profile
    const updatedProfile = await prisma.profile.update({
        where: { userId },
        data: {
            firstName,
            lastName,
            bio,
            photoURL
        },
    });

    // Send the response
    res.status(200).json({
        message: 'Profile updated successfully',
        profile: updatedProfile
    });
});