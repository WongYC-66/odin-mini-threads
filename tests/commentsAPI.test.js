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

describe('Comments API', () => {
  let token;
  let token2;
  let testUserId;
  let dummyUser1Id;
  let postId;

  // -------- before all --------
  beforeAll(async () => {
    // reset prisma database
    await cleanseDatabase()

    // Create a test user and get a token
    const signUpResponse = await request(app)
      .post('/users/sign-up')
      .send({ username: 'testuser', password: 'testpassword' });

    const loginResponse = await request(app)
      .post('/users/login')
      .send({ username: 'testuser', password: 'testpassword' });

    token = loginResponse.body.token;
    testUserId = loginResponse.body.id; // Adjust according to actual response structure

    // Create dummyUser and a new post by dummyUser
    const dummyUser1Response = await request(app)
      .post('/users/sign-up')
      .send({ username: 'dummyUser1', password: 'password' });

    token2 = dummyUser1Response.body.token
    dummyUser1Id = dummyUser1Response.body.id;

    const postByDummyUserResponse = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token2}`)
      .send({ content: 'This is a test post by dummyuser' });

    postId = postByDummyUserResponse.body.post.id

  });
  // -------- before all --------

  // -------- after all --------
  afterAll(async () => {
    // Cleanup code here if needed, e.g., closing database connections
    // reset prisma database
    await cleanseDatabase()
    await prisma.$disconnect();
  });
  // -------- after all --------

  it('should create a comment successfully', async () => {
    const response = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'This is a test comment by test user',
      })
      .expect(201);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Comment created successfully');
    expect(response.body.comment.content).toBe('This is a test comment by test user');
    expect(response.body.comment.postId).toBe(postId);
    expect(response.body.comment.authorId).toBe(testUserId);
  });

  it('should return 400 if postId or content is missing', async () => {
    const response = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'This is a test comment by test user' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('PostId and content are required');
  });

  it('should return 401 if no token is provided/invalid token', async () => {
    const response = await request(app)
      .post('/comments')
      .send({
        postId,
        content: 'This is a test comment by test user',
      })

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 if post is not found', async () => {
    const response = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: '52323123',  // non existent post
        content: 'This is a test comment by test user',
      })

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Post not found');
  });



});