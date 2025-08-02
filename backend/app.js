// Import Node.js core modules
const path = require('path');

// Import third-party packages
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const graphqlHttp = require('express-graphql');

// Import application modules
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./util/file');

// Initialize Express application
const app = express();

// Configure multer for file storage
// This defines where uploaded files will be stored and how they'll be named
const fileStorage = multer.diskStorage({
  // Set destination folder for uploaded files
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  // Generate unique filename using timestamp + original filename
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

// File filter to only allow image uploads
// This function determines which files are accepted for upload
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    // Accept the file if it's a valid image format
    cb(null, true);
  } else {
    // Reject the file if it's not an image
    cb(null, false);
  }
};

// Middleware setup
// Parse JSON request bodies (for application/json content-type)
// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

// Configure multer middleware for handling file uploads
// Uses the storage and filter configurations defined above
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

// Serve static files from the 'images' directory
// This allows clients to access uploaded images via /images/filename
app.use('/images', express.static(path.join(__dirname, 'images')));

// CORS (Cross-Origin Resource Sharing) middleware
// This allows the frontend to communicate with the backend from different origins
app.use((req, res, next) => {
  // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow specific HTTP methods
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  // Allow specific headers in requests
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Apply authentication middleware to all routes
// This checks for JWT tokens and sets req.isAuth and req.userId
app.use(auth);

// REST endpoint for image upload (separate from GraphQL)
// This is needed because GraphQL doesn't handle file uploads well
app.put('/post-image', (req, res, next) => {
  // Check if user is authenticated
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided!' });
  }
  // If updating an existing post, delete the old image
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  // Return the path of the newly uploaded file
  return res
    .status(201)
    .json({ message: 'File stored.', filePath: req.file.path });
});

// GraphQL endpoint configuration
// This sets up the main GraphQL API endpoint at /graphql
app.use(
  '/graphql',
  graphqlHttp({
    // GraphQL schema definition (types, queries, mutations)
    schema: graphqlSchema,
    // GraphQL resolver functions (actual implementation)
    rootValue: graphqlResolver,
    // Enable GraphiQL IDE for development (browser-based query tool)
    graphiql: true,
    // Custom error formatting function
    // This standardizes error responses and extracts meaningful error information
    formatError(err) {
      // If it's a GraphQL validation error, return as-is
      if (!err.originalError) {
        return err;
      }
      // Extract custom error data, message, and status code
      const data = err.originalError.data;
      const message = err.message || 'An error occurred.';
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data };
    }
  })
);

// Global error handling middleware
// This catches any errors that weren't handled elsewhere in the application
app.use((error, req, res, next) => {
  console.log(error);
  // Extract status code from error or default to 500
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  // Send standardized error response
  res.status(status).json({ message: message, data: data });
});

// Database connection and server startup
mongoose
  .connect(
    'mongodb+srv://maximilian:9u4biljMQc4jjqbe@cluster0-ntrwp.mongodb.net/messages?retryWrites=true'
  )
  .then(result => {
    // Start the Express server on port 8080 after successful database connection
    app.listen(8080);
  })
  .catch(err => console.log(err));


