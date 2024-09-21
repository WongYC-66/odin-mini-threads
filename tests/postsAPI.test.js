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
  let token2;
  let testUserId;
  let dummyUser1Id;

  // -------- before all --------
  beforeAll(async () => {
    // reset prisma database
    await cleanseDatabase()

    // Create a test user and get a token
    const signUpResponse = await request(app)
      .post('/users/sign-up')
      .send({ username: 'testuser', password: 'testpassword', confirmPassword: 'testpassword' });

    const loginResponse = await request(app)
      .post('/users/login')
      .send({ username: 'testuser', password: 'testpassword' });

    token = loginResponse.body.token;
    testUserId = loginResponse.body.id; // Adjust according to actual response structure

    // Create and follow another user
    const dummyUser1Response = await request(app)
      .post('/users/sign-up')
      .send({ username: 'dummyuser1', password: 'dummypassword', confirmPassword: 'dummypassword' });

    dummyUser1Id = dummyUser1Response.body.id;
    token2 = dummyUser1Response.body.token

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


  it('create - should return 400 if content is missing', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Content is required');
  });

  it('create - should return 401 if no token is provided/invalid token', async () => {
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

  it('get - should return 401 if no token is provided/invalid token', async () => {
    const response = await request(app)
      .get('/posts')

    expect(response.statusCode).toBe(401);
  });

  it('should get one post by post id', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'dummy post',
        authorId: testUserId,
      },
    });

    const response = await request(app)
      .get('/posts/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
  });

  it('get - should return 401 if no token is provided/invalid token', async () => {
    const response = await request(app)
      .get('/posts/1')

    expect(response.statusCode).toBe(401);
  });

  it('should update a post successfully', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'Original Post by testuser',
        authorId: testUserId,
      },
    });

    const response = await request(app)
      .put('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated content', postId: newPost.id });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Post updated successfully');
    expect(response.body.post.content).toBe('Updated content');
  });

  it('update - should return 400 if content or postId is missing', async () => {
    const response = await request(app)
      .put('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated content' }); // Missing postId

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Content and postId are required');
  });

  it('update - should return 404 if post is not found', async () => {
    const response = await request(app)
      .put('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated content', postId: 752349 }); // Non-existent postId

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Post not found');
  });

  it('update - should return 403 if user is not the author', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'Original Post by testuser',
        authorId: testUserId,
      },
    });

    const response = await request(app)
      .put('/posts')
      .set('Authorization', `Bearer ${token2}`) // other user's token
      .send({ content: 'Malicious update', postId: newPost.id });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('You are not authorized to update this post');
  });

  it('should delete a post successfully', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'A post pending to be deleted',
        authorId: testUserId,
      },
    });

    const response = await request(app)
      .delete('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: newPost.id });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Post deleted successfully');
  });

  it('del - should return 400 if postId is missing', async () => {
    const response = await request(app)
      .delete('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // Missing postId

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('PostId are required');
  });

  it('del - should return 404 if post is not found', async () => {
    const response = await request(app)
      .delete('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: "123456" });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Post not found');
  });

  it('del - should return 403 if user is not the author', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'A post pending to be deleted ~2',
        authorId: testUserId,
      },
    });

    const response = await request(app)
      .delete(`/posts`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ postId: newPost.id });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('You are not authorized to delete this post');
  });

  it('should like a post successfully', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'A post to be liked',
        authorId: testUserId,
      },
    });

    const response = await request(app)
      .post('/posts/like-unlike')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: newPost.id, like: true });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Post liked successfully');
  });

  it('should not allow liking the same post twice', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'A post to be liked, but not twice',
        authorId: testUserId,
        likedBy: {
          connect: { id: testUserId }
        }
      },
    });

    const response = await request(app)
      .post('/posts/like-unlike')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: newPost.id, like: true });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Post already liked');
  });

  it('should unlike a post successfully', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'A post to be liked, but not twice',
        authorId: testUserId,
        likedBy: {
          connect: { id: testUserId }
        }
      },
    });

    const response = await request(app)
      .post('/posts/like-unlike')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: newPost.id, like: false });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Post unliked successfully');
  });

  it('should not allow unliking a post that is not liked', async () => {
    // Create a post by the self
    const newPost = await prisma.post.create({
      data: {
        content: 'A post to be liked, but not twice',
        authorId: testUserId,
      },
    });

    const response = await request(app)
      .post('/posts/like-unlike')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: newPost.id, like: false });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Post not liked by this user');
  });


});