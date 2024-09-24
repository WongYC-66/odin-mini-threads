const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt')

// faker profile randomizer
const { faker } = require('@faker-js/faker');
faker.seed(123);

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
                        bio: `${username}'s bio,  ${faker.person.bio()}`,
                        // photoURL: "/user2.png",
                        photoURL: faker.image.avatarGitHub(),
                        firstName: faker.person.firstName(),  // random name
                        lastName: faker.person.lastName(),  // random name
                    }
                },
                posts: {
                    create: {
                        content: faker.lorem.sentences({ min: 1, max: 3 }) + ". This is a fake posts, generated from faker",
                    }
                },
            },
            include: {
                userProfile: true,
            }
        })
    })
    let tenUsers = await Promise.all(promiseArr)

    // follow self, like random post
    let postIdArr = await prisma.post.findMany()
    postIdArr = postIdArr.map(post => post.id).sort((a, b) => Math.random() - 0.5)

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
            },
            include: {
                userProfile: true,
            }
        })
    })

    responseArr = await Promise.all(promiseArr)

    // create Guest user, follow everyone :)
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

    responseArr = tenUsers.map(user =>
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
