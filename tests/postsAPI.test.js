process.env.NODE_ENV = 'test'

const request = require('supertest');
const app = require('../app'); // Import the Express app


describe('Posts API', () => {
  let token;
  let testUserId;
  let dummyUser1Id;
  let dummyUser2Id;

  beforeAll(async () => {
    // Create a test user and get a token
    const signUpResponse = await request(app)
      .post('/users/sign-up')
      .send({ username: 'testuser', password: 'testpassword' });

    const loginResponse = await request(app)
      .post('/users/login')
      .send({ username: 'testuser', password: 'testpassword' });

    token = loginResponse.body.token;
    testUserId = loginResponse.body.id; // Adjust according to actual response structure

    // Optionally, add cleanup to avoid duplicate entries in tests
    // await prisma.post.deleteMany({ where: { authorId: testUserId } });

    // Create and follow another user
    const dummyUser1Response = await request(app)
      .post('/users/sign-up')
      .send({ username: 'dummyUser1', password: 'password' });

    followedUserId = followedUserResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup code here if needed, e.g., closing database connections
    // await prisma.$disconnect();
  });

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
  
});