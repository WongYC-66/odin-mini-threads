process.env.NODE_ENV = 'test'

const request = require('supertest');
const app = require('../app'); // Import the Express app

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
    // await cleanseDatabase()
    await prisma.$disconnect();
  });
  // ----- after all -----


  it('should sign up a new user', async () => {
    const response = await request(app)
      .post('/users/sign-up')
      .send({ username: 'newuser', password: 'newpassword', confirmPassword: 'newpassword' });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('should login an existing user', async () => {
    const response = await request(app)
      .post('/users/login')
      .send({ username: 'testuser', password: 'testpassword' });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('should follow an existing user', async () => {
    const response = await request(app)
      .post('/users/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({ followId: dummyUser1Id });

    await request(app)
      .post('/users/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({ followId: dummyUser2Id });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User followed successfully');
  });

  it('should not follow an existing user without authentication', async () => {
    const response = await request(app)
      .post('/users/follow')
      .send({ followId: dummyUser2Id });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent user to follow', async () => {
    const response = await request(app)
      .post('/users/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({ followId: '152232' });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  it('should unfollow an existing user', async () => {
    const response = await request(app)
      .post('/users/unfollow')
      .set('Authorization', `Bearer ${token}`)
      .send({ unfollowId: dummyUser1Id });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User unfollowed successfully');
  });

  it('should not unfollow a user without authentication', async () => {
    const response = await request(app)
      .post('/users/unfollow')
      .send({ unfollowId: dummyUser2Id });

    expect(response.statusCode).toBe(401);
  });

  it('should not unfollow yourself', async () => {
    const response = await request(app)
      .post('/users/unfollow')
      .set('Authorization', `Bearer ${token}`)
      .send({ unfollowId: testUserId }); // Assuming the ID is 1 for the same user

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Cannot unfollow yourself');
  });

  it('should return 404 for non-existent user to unfollow', async () => {
    const response = await request(app)
      .post('/users/unfollow')
      .set('Authorization', `Bearer ${token}`)
      .send({ unfollowId: '99349' }); // Non-existent user ID

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

});