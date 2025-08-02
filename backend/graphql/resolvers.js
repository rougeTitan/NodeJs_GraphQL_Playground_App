// Import required packages for authentication, validation, and utilities
const bcrypt = require('bcryptjs');        // For password hashing and comparison
const validator = require('validator');     // For input validation (email, length, etc.)
const jwt = require('jsonwebtoken');       // For creating and verifying JWT tokens

// Import database models
const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../util/file');

// GraphQL resolver functions - these implement the actual logic for each GraphQL operation
module.exports = {
  /**
   * Create a new user account (registration)
   * @param {Object} userInput - Contains email, name, and password
   * @param {Object} req - Express request object
   * @returns {Object} Created user object
   */
  createUser: async function({ userInput }, req) {
    //   const email = args.userInput.email;
    
    // Input validation array to collect any validation errors
    const errors = [];
    
    // Validate email format using validator library
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'E-Mail is invalid.' });
    }
    
    // Validate password length and ensure it's not empty
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password too short!' });
    }
    
    // If validation errors exist, throw error with details
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    
    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }
    
    // Hash the password for secure storage (salt rounds: 12)
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    
    // Create new user instance with hashed password
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    
    // Save user to database
    const createdUser = await user.save();
    
    // Return user data with converted ObjectId to string
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  
  /**
   * User login authentication
   * @param {string} email - User's email address
   * @param {string} password - User's plain text password
   * @returns {Object} Authentication data with JWT token and user ID
   */
  login: async function({ email, password }) {
    // Find user by email address
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('User not found.');
      error.code = 401;
      throw error;
    }
    
    // Compare provided password with stored hashed password
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Password is incorrect.');
      error.code = 401;
      throw error;
    }
    
    // Create JWT token with user information
    // Token expires in 1 hour for security
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      'somesupersecretsecret',
      { expiresIn: '1h' }
    );
    
    // Return authentication data
    return { token: token, userId: user._id.toString() };
  },
  
  /**
   * Create a new post
   * @param {Object} postInput - Contains title, content, and imageUrl
   * @param {Object} req - Express request object (contains auth info)
   * @returns {Object} Created post object
   */
  createPost: async function({ postInput }, req) {
    // Check if user is authenticated
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    
    // Input validation array
    const errors = [];
    
    // Validate post title
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid.' });
    }
    
    // Validate post content
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid.' });
    }
    
    // If validation errors exist, throw error with details
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    
    // Verify user exists in database
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid user.');
      error.code = 401;
      throw error;
    }
    
    // Create new post instance
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user
    });
    
    // Save post to database
    const createdPost = await post.save();
    
    // Add post reference to user's posts array
    user.posts.push(createdPost);
    await user.save();
    
    // Return created post with formatted timestamps
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    };
  },
  
  /**
   * Get paginated list of posts
   * @param {number} page - Page number for pagination (optional, defaults to 1)
   * @param {Object} req - Express request object (contains auth info)
   * @returns {Object} Object containing posts array and total count
   */
  posts: async function({ page }, req) {
    // Check if user is authenticated
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    
    // Set default page to 1 if not provided
    if (!page) {
      page = 1;
    }
    
    // Define posts per page (configured for pagination)
    const perPage = 2;
    
    // Get total count of posts for pagination metadata
    const totalPosts = await Post.find().countDocuments();
    
    // Fetch posts with pagination, sorting, and population of creator field
    const posts = await Post.find()
      .sort({ createdAt: -1 })                    // Sort by creation date (newest first)
      .skip((page - 1) * perPage)                 // Skip posts for pagination
      .limit(perPage)                             // Limit results per page
      .populate('creator');                       // Populate creator field with user data
    
    return {
      // Map posts to include formatted timestamps and string IDs
      posts: posts.map(p => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        };
      }),
      totalPosts: totalPosts
    };
  },
  
  /**
   * Get a single post by ID
   * @param {string} id - Post ID
   * @param {Object} req - Express request object (contains auth info)
   * @returns {Object} Single post object
   */
  post: async function({ id }, req) {
    // Check if user is authenticated
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    
    // Find post by ID and populate creator information
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }
    
    // Return post with formatted timestamps
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  },
  
  /**
   * Update an existing post
   * @param {string} id - Post ID to update
   * @param {Object} postInput - Updated post data
   * @param {Object} req - Express request object (contains auth info)
   * @returns {Object} Updated post object
   */
  updatePost: async function({ id, postInput }, req) {
    // Check if user is authenticated
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    
    // Find post and populate creator information
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }
    
    // Check if the authenticated user is the creator of the post
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized!');
      error.code = 403;
      throw error;
    }
    
    // Input validation
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid.' });
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid.' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    
    // Update post fields
    post.title = postInput.title;
    post.content = postInput.content;
    // Only update image URL if a new one is provided (not 'undefined' string)
    if (postInput.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl;
    }
    
    // Save updated post
    // Save updated post
    const updatedPost = await post.save();
    
    // Return updated post with formatted timestamps
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },
  
  /**
   * Delete a post
   * @param {string} id - Post ID to delete
   * @param {Object} req - Express request object (contains auth info)
   * @returns {boolean} Success status
   */
  deletePost: async function({ id }, req) {
    // Check if user is authenticated
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    
    // Find post to delete
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }
    
    // Check if the authenticated user is the creator of the post
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized!');
      error.code = 403;
      throw error;
    }
    
    // Delete associated image file from filesystem
    clearImage(post.imageUrl);
    
    // Remove post from database
    await Post.findByIdAndRemove(id);
    
    // Remove post reference from user's posts array
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();
    
    // Return success status
    return true;
  },
  
  /**
   * Get current user's information
   * @param {Object} args - GraphQL arguments (unused)
   * @param {Object} req - Express request object (contains auth info)
   * @returns {Object} User object
   */
  user: async function(args, req) {
    // Check if user is authenticated
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    
    // Find user by ID from JWT token
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No user found!');
      error.code = 404;
      throw error;
    }
    
    // Return user data with string ID
    return { ...user._doc, _id: user._id.toString() };
  },
  
  /**
   * Update user's status message
   * @param {string} status - New status message
   * @param {Object} req - Express request object (contains auth info)
   * @returns {Object} Updated user object
   */
  updateStatus: async function({ status }, req) {
    // Check if user is authenticated
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    
    // Find user by ID from JWT token
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No user found!');
      error.code = 404;
      throw error;
    }
    
    // Update user's status and save
    user.status = status;
    await user.save();
    
    // Return updated user data
    return { ...user._doc, _id: user._id.toString() };
  }
};
