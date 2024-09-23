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

// Get one user profile by username (protected route)
exports.get_one_profile = asyncHandler(async (req, res) => {
    const userId = Number(req.user.id)
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

    if (!profile) {
        return res.status(404).json({
            error: 'Username not found',
        });
    }

    // give attr of is_followed
    const { following } = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            following: {
                select: {
                    id: true
                }
            }
        }
    })
    profile.is_followed = following.some(({ id }) => id == profile.id)

    // give attr of threads  i.e. posts
    const threads = await prisma.post.findMany({
        where: {
            author: { 
                username: username
            }, 
        },
        select: {
            id: true,
            content: true,
            timestamp: true,
            author: {
                select: {
                    id: true,        // Include author ID
                    username: true,      // Include author name
                    userProfile: {
                        select: {
                            photoURL: true
                        }
                    }
                    // Do not select password or any other sensitive fields
                },
            },
            _count: {
                select: {
                    likedBy: true,   // Count of likedBy users
                    comments: true,  // Count of comments
                },
            },
        },
        orderBy: {
            timestamp: 'desc', // Order posts by timestamp in descending order
        },
    });
    profile.threads = threads

    // give attr of threads  i.e. posts
    const replies = await prisma.comment.findMany({
        where: {
            author: { 
                username: username
            }, 
        },
        select: {
            id: true,
            content: true,
            timestamp: true,
            author: {
                select: {
                    id: true,        // Include author ID
                    username: true,      // Include author name
                    userProfile: {
                        select: {
                            photoURL: true
                        }
                    }
                    // Do not select password or any other sensitive fields
                },
            },
            Post: {
                select: {
                    id: true,
                    content: true,
                    timestamp: true,
                    _count: {
                        select: {
                            likedBy: true,   // Count of likedBy users
                            comments: true,  // Count of comments
                        },
                    },
                    author: {
                        select: {
                            id: true,        // Include author ID
                            username: true,      // Include author name
                            userProfile: {
                                select: {
                                    photoURL: true
                                }
                            }
                            // Do not select password or any other sensitive fields
                        },
                    },
                },
            },
        },
        orderBy: {
            timestamp: 'desc', // Order posts by timestamp in descending order
        },
    });
    profile.replies = replies

    // get list of likedPosts of this user
    let { postLiked } = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            postLiked: {
                select: { id: true },
            },
        }
    });
    postLiked = postLiked.map(({ id }) => id)


    // Send the response
    res.status(200).json({
        message: 'Profiles retrieved successfully',
        profile,
        postLiked,
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