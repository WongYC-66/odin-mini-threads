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

describe('Posts API', () => {
  let token;
  let testUserId;
  let dummyUser1Id;

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

    // Create and follow another user
    const dummyUser1Response = await request(app)
      .post('/users/sign-up')
      .send({ username: 'dummyUser1', password: 'password' });

    dummyUser1Id = dummyUser1Response.body.id;

    await request(app)
      .post('/users/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({ followId: dummyUser1Id });



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


  it('should create a new post', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'This is a test post' });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Post created successfully');
    expect(response.body.post).toBeDefined();
    expect(response.body.post.content).toBe('This is a test post');
    expect(response.body.post.authorId).toBe(testUserId);
  });


  it('should return 400 if content is missing', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Content is required');
  });

  it('should return 401 if no token is provided/invalid token', async () => {
    const response = await request(app)
      .post('/posts')
      .send({ content: 'This is a test post' });

    expect(response.statusCode).toBe(401);
  });

  it('should get posts from users the authenticated user is following', async () => {

    // Create a post by the followed user
    await prisma.post.create({
      data: {
        content: 'This is a post by dummyuser1',
        authorId: dummyUser1Id,
      },
    });
    // Create a post by the self
    await prisma.post.create({
      data: {
        content: 'This is a post by testuser',
        authorId: testUserId,
      },
    });

    const response = await request(app)
      .get('/posts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.posts).toBeDefined();
    expect(response.body.posts.length).toBeGreaterThan(0);
    expect(response.body.posts[0].content).toBe('This is a post by testuser');
    expect(response.body.posts[1].content).toBe('This is a post by dummyuser1');

  });

});