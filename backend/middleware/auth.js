// Import JWT library for token verification
const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for Express
 * This middleware checks for JWT tokens in the Authorization header
 * and sets authentication status on the request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
module.exports = (req, res, next) => {
  // Get Authorization header from request
  const authHeader = req.get('Authorization');
  
  // If no Authorization header is present, mark as not authenticated
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  
  // Extract token from "Bearer <token>" format
  // Split by space and take the second part (the actual token)
  const token = authHeader.split(' ')[1];
  let decodedToken;
  
  try {
    // Verify and decode the JWT token using the secret key
    // This will throw an error if token is invalid or expired
    decodedToken = jwt.verify(token, 'somesupersecretsecret');
  } catch (err) {
    // If token verification fails, mark as not authenticated
    req.isAuth = false;
    return next();
  }
  
  // If token couldn't be decoded (shouldn't happen if verify succeeded)
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  
  // Token is valid - extract user ID and set authentication status
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
