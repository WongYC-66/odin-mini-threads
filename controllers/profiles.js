const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('express-async-handler');

// Get all user profiles (protected route)
exports.get_profiles = asyncHandler(async (req, res) => {
    // Fetch all profiles from the database
    const profiles = await prisma.profile.findMany({
        include: {
            user: true // Include user data associated with the profile if needed
        },
        orderBy: { firstName: 'asc' },
    });

    // Send the response
    res.status(200).json({
        message: 'Profiles retrieved successfully',
        profiles
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
        }
    });

    // Send the response
    res.status(200).json({
        message: 'Profile updated successfully',
        profile: updatedProfile
    });
});