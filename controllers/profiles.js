const asyncHandler = require('express-async-handler');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// supabase cloud
const { createClient } = require("@supabase/supabase-js")
// Create Supabase client
const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_API_KEY)

const multer = require('multer')
const upload = multer({ dest: './public/uploads/' })

const path = require('path');
const fs = require('fs');
const stream = require('stream');
const { decode } = require('base64-arraybuffer')

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
            images: true,
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
                    images: true,
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

// Update photo user profile (protected route)
exports.update_photo_profile = [
    upload.single('avatar'),
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any

    asyncHandler(async (req, res) => {
        if (!req.file)
            return res.status('500').json({
                error: "file upload failed - no file uploaded"
            })

        const userId = Number(req.user.id)

        const { data, error } = await uploadToDataBase(req.file, userId)

        if(error){
            // console.error(error)
            return res.status('500').json({     // supabase error
                error: "file upload failed - supabase error"
            })
        }
        
        const photoURL = `${process.env.SUPABASE_PROJECT_URL}/storage/v1/object/public/${data.fullPath}`

        // delete uploaded file at backend
        fs.unlinkSync(req.file.path);

        // console.log(photoURL)
        return res.status(201).json({
            message: "uploaded",
            photoURL : photoURL,
        })
    })
];

const uploadToDataBase = async (fileInfo, userId) => {
    const { originalname, encoding, mimetype, destination, path, size } = fileInfo
    // console.log(fileInfo)

    // Read the file as a binary buffer
    // Convert buffer to base64 string
    const fileBuffer = fs.readFileSync(path);
    const base64Data = fileBuffer.toString('base64');

    // upload to supabase
    const { data, error } = await supabase.storage
        .from('everything')
        .upload(
            `${userId}/${originalname}`, // file destination in supabase
            decode(base64Data),
            { upsert: true, contentType: mimetype } // option
        )
    // upload = save to /10/logo.webp
    // console.log({data})
    // console.log({error})

    return { data, error }
}