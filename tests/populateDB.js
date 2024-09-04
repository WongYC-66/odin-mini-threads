const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt')

// faker profile randomizer
const { faker } = require('@faker-js/faker');
faker.seed(123);

const populateDB = async () => {
    // create account admin1
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
                        photoURL: "no photo yet",
                        firstName: faker.person.firstName(),  // random name
                        lastName: faker.person.lastName(),  // random name
                    }
                },
                posts: {
                    create: {
                        content: faker.lorem.sentences({ min: 1, max: 3 }) + ". This is a fake profile, generated from faker"
                    }
                },
            },
            include: {
                userProfile: true,
            }
        })
    })
    let responseArr = await Promise.all(promiseArr)
    // follow self, like random post

    let postIdArr = await prisma.post.findMany()
    postIdArr = postIdArr.map(post => post.id).sort((a,b) => Math.random() - 0.5)

    promiseArr = responseArr.map(user => {
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

    // console.log(responseArr)
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
