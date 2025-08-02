// Import Mongoose for MongoDB object modeling
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * User Schema Definition
 * Defines the structure and validation rules for user documents in MongoDB
 */
const userSchema = new Schema({
  // User's email address - must be unique and required
  email: {
    type: String,
    required: true
  },
  // User's hashed password - required for authentication
  password: {
    type: String,
    required: true
  },
  // User's display name - required
  name: {
    type: String,
    required: true
  },
  // User's status message - optional with default value
  status: {
    type: String,
    default: 'I am new!'
  },
  // Array of references to posts created by this user
  // Uses ObjectId references to Post documents for relational data
  posts: [
    {
      type: Schema.Types.ObjectId,  // MongoDB ObjectId type
      ref: 'Post'                   // References the Post model
    }
  ]
});

// Export the User model based on the schema
// This creates a model that can be used to interact with the 'users' collection
module.exports = mongoose.model('User', userSchema);
