// Import Mongoose for MongoDB object modeling
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Post Schema Definition
 * Defines the structure and validation rules for post documents in MongoDB
 * The second parameter enables automatic timestamps (createdAt, updatedAt)
 */
const postSchema = new Schema(
  {
    // Post title - required field
    title: {
      type: String,
      required: true
    },
    // URL/path to the post's associated image - required
    imageUrl: {
      type: String,
      required: true
    },
    // Post content/body text - required field
    content: {
      type: String,
      required: true
    },
    // Reference to the user who created this post
    // Uses ObjectId to establish relationship with User model
    creator: {
      type: Schema.Types.ObjectId,  // MongoDB ObjectId type
      ref: 'User',                  // References the User model
      required: true                // Every post must have a creator
    }
  },
  { 
    timestamps: true  // Automatically adds createdAt and updatedAt fields
  }
);

// Export the Post model based on the schema
// This creates a model that can be used to interact with the 'posts' collection
module.exports = mongoose.model('Post', postSchema);
