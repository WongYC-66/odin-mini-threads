process.env.NODE_ENV = 'test'

const request = require('supertest');
const app = require('../app'); // Import the Express app

describe('Users API', () => {
  let token;

  beforeAll(async () => {
    // Setup code here if needed, e.g., connecting to a test database
    await request(app)
      .post('/users/sign-up')
      .send({ username: 'testuser', password: 'testpassword' });

    const response = await request(app)
      .post('/users/login')
      .send({ username: 'testuser', password: 'testpassword' });

    token = response.body.token;
    // console.log({token})
  });

  afterAll(async () => {
    // Cleanup code here if needed, e.g., closing database connections
    // Note: Implement cleanup logic if you have a test database
  });

  it('should sign up a new user', async () => {
    const response = await request(app)
      .post('/users/sign-up')
      .send({ username: 'newuser', password: 'newpassword' });

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
  return

  it('should access protected profile route', async () => {
    const response = await request(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toBe('testuser');
  });

  it('should not access protected profile route without token', async () => {
    const response = await request(app)
      .get('/users/profile');

    expect(response.statusCode).toBe(401);
  });
});