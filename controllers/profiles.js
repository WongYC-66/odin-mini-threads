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