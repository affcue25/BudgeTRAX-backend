const jwt = require('jsonwebtoken');

// Create a test JWT token
const payload = {
  userId: 'test-user-id',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
};

const token = jwt.sign(payload, 'your-jwt-secret-key');
console.log('Test JWT Token:', token);
