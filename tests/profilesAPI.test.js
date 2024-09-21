process.env.NODE_ENV = 'test'

const request = require('supertest');
const app = require('../app.js'); // Import the Express app
const { main: populateDB } = require('./populateDB.js')

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const cleanseDatabase = async () => {
  // reset prisma database
  await prisma.user.deleteMany()
  await prisma.post.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.profile.deleteMany()
}

describe('Users API', () => {
  let token;
  let testUserId;
  let dummyUser1Id;
  let dummyUser2Id;

  // ----- before all -----
  beforeAll(async () => {
    // reset prisma database
    await cleanseDatabase()
    await populateDB()  // populate 10 users with posts

    // create dummy user
    await request(app)
      .post('/users/sign-up')
      .send({ username: 'testuser', password: 'testpassword', confirmPassword: 'testpassword' });

    const response = await request(app)
      .post('/users/login')
      .send({ username: 'testuser', password: 'testpassword' });

    token = response.body.token;
    testUserId = response.body.id

    const dummyResponse1 = await request(app)
      .post('/users/sign-up')
      .send({ username: 'dummyuser1', password: 'dummypassword', confirmPassword: 'dummypassword' });


    const dummyResponse2 = await request(app)
      .post('/users/sign-up')
      .send({ username: 'dummyuser2', password: 'dummypassword', confirmPassword: 'dummypassword' });

    dummyUser1Id = dummyResponse1.body.id
    dummyUser2Id = dummyResponse2.body.id
  });
  // ----- before all -----

  // ----- after all -----
  afterAll(async () => {
    // Cleanup code here if needed, e.g., closing database connections
    // reset prisma database
    await cleanseDatabase()
    await prisma.$disconnect();
  });
  // ----- after all -----

  it('should retrieve all profiles successfully', async () => {
    const response = await request(app)
      .get('/profiles')
      .set('Authorization', `Bearer ${token}`)

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Profiles retrieved successfully');
    expect(response.body.profiles).toBeInstanceOf(Array);
    expect(response.body.profiles.length).toBeGreaterThan(0);
    expect(response.body.profiles[0].id).toBeDefined();
    expect(response.body.profiles[0].bio).toBeDefined();
    expect(response.body.profiles[0].photoURL).toBeDefined();
  });

  it('should update the user profile successfully', async () => {
    const response = await request(app)
      .put('/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        bio: 'Updated bio',
        photoURL: 'updated.jpg'
      })

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Profile updated successfully');
    expect(response.body.profile.firstName).toBe('Jane');
    expect(response.body.profile.lastName).toBe('Doe');
    expect(response.body.profile.bio).toBe('Updated bio');
    expect(response.body.profile.photoURL).toBe('updated.jpg');
  });

  it('put - should return 401 if no token is provided/invalid token', async () => {
    const response = await request(app)
      .put('/profiles')

    expect(response.statusCode).toBe(401);
  });

  it('get - profile/:userId should retrieve one profile successfully', async () => {
    const response = await request(app)
      .get(`/profiles/${testUserId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.statusCode).toBe(200);
  });

  it('get - profile/:userId should return 401 if no token is provided/invalid token', async () => {
    const response = await request(app)
    .get(`/profiles/${testUserId}`)

    expect(response.statusCode).toBe(401);
  });



});