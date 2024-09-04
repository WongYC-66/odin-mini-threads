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

  it('should retrieve comments successfully', async () => {
    //  Create 2 comments by self
    await prisma.comment.create({
      data: {
        content: 'Another comment by dummy user',
        authorId: dummyUser1Id,
        postId
      },
    });

    await prisma.comment.create({
      data: {
        content: 'Lastest comment by test user',
        authorId: testUserId,
        postId
      },
    });
    const response = await request(app)
      .get('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId })

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Comment retrieved successfully');
    expect(response.body.comment).toBeInstanceOf(Array);

    expect(response.body.comment[0].content).toBe('Lastest comment by test user');
    expect(response.body.comment[1].content).toBe('Another comment by dummy user');
  });

  it('should update a comment successfully', async () => {
    //  Create a comment by self
    const commentResponse = await prisma.comment.create({
      data: {
        content: 'Original comment content by dummy user',
        authorId: dummyUser1Id,
        postId
      },
    });
    const response = await request(app)
      .put('/comments')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        commentId: commentResponse.id,
        content: 'Updated comment content',
      })

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Comment updated successfully');
    expect(response.body.comment.id).toBe(commentResponse.id);
    expect(response.body.comment.content).toBe("Updated comment content");
  });

  it('should return 401 if no token is provided', async () => {
    const response = await request(app)
      .put('/comments')
      .send({
        commentId: '1',
        content: 'Updated comment content',
      })

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 if commentId or content is missing', async () => {
    const response = await request(app)
      .put('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated comment content' })

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('CommentId and content are required');
  });

  it('should return 403 if user tries to update another user\'s comment', async () => {

    //  Create a comment by self
    const commentResponse = await prisma.comment.create({
      data: {
        content: 'Original comment content by dummy user',
        authorId: dummyUser1Id,
        postId
      },
    });

    const response = await request(app)
      .put('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        commentId: commentResponse.id,
        content: 'Trying to update someone else\'s comment',
      })

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe('Forbidden: You are not allowed to update this comment');
  });

  it('should return 404 if comment is not found', async () => {
    const response = await request(app)
      .put('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        commentId: 5913999, // Non-existent comment ID
        content: 'This is an updated comment content',
      })

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Comment not found');
  });

});