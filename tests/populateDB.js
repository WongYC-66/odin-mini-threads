const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt')

// faker profile randomizer
const { faker } = require('@faker-js/faker');
faker.seed();

const populateDB = async () => {
    // create account user1-user10
    let arr = Array(10).fill().map((_, i) => i + 1)

    let promiseArr = arr.map(async (x) => {
        let username = `user${x}`
        return await prisma.user.create({
            data: {
                username: username,
                password: bcrypt.hashSync(username, 10),
                userProfile: {
                    create: {
                        bio: `${username}'s bio,  ${faker.person.bio()}, this is auto-generated bio by faker`,
                        // photoURL: "/user2.png",
                        photoURL: faker.image.avatarGitHub(),
                        firstName: faker.person.firstName(),  // random name
                        lastName: faker.person.lastName(),  // random name
                    }
                },
                posts: {
                    create: [
                        {
                            content: faker.lorem.sentences({ min: 1, max: 3 }) + ". This is a fake posts, generated from faker",
                            images: {
                                create: {
                                    imgURL: faker.image.url(),
                                }
                            }
                        },
                        {
                            content: faker.lorem.sentences({ min: 1, max: 2 }) + ". This is a fake posts, generated from faker",
                        },
                    ]
                },
            },
            include: {
                userProfile: true,
            }
        })
    })
    let tenUsers = await Promise.all(promiseArr)

    // follow self, like random post, 
    let allPosts = await prisma.post.findMany()
    postIdArr = allPosts.map(post => post.id).sort(() => Math.random() - 0.5)

    promiseArr = tenUsers.map(user => {
        return prisma.user.update({
            where: { id: user.id },
            data: {
                following: {
                    connect: { id: user.id }
                },
                postLiked: {
                    connect: { id: postIdArr.pop() }
                }
            }
        })
    })

    // make random reply
    let postIdArr2 = allPosts.map(post => post.id).sort(() => Math.random() - 0.5)
    let promiseArr2 = tenUsers.map(user => {
        return prisma.post.update({
            where: { id: postIdArr2.pop() },
            data: {
                comments: {
                    create: {
                        content: faker.lorem.sentences({ min: 1, max: 2 }) + ". This is a fake comment, generated from faker",
                        authorId: user.id
                    }
                }
            }
        })
    })

    // responseArr = await Promise.all([...promiseArr, ...promiseArr2])
    responseArr = await Promise.all([...promiseArr, ...promiseArr2])

    // create Guest user, follow self & everyone :)
    const guestUser = await prisma.user.create({
        data: {
            username: "guest",
            password: bcrypt.hashSync("guest", 10),
            userProfile: {
                create: {
                    bio: `Guest's bio,  ${faker.person.bio()}`,
                    photoURL: faker.image.avatarGitHub(),
                    firstName: "Guest",
                }
            },
        },
    })

    responseArr = [guestUser, ...tenUsers].map(user =>
        prisma.user.update({
            where: { id: guestUser.id },
            data: {
                following: {
                    connect: { id: user.id }
                },
            },
        })
    )

    await Promise.all(responseArr)

}

exports.main = async () => {
    try {
        console.log('starting to populate db ...')
        await populateDB()
        console.log('finished populating db ...')
    } catch (e) {
        console.error(e)
    } finally {
        // await prisma.$disconnect()
    }
}
