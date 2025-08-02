// Import GraphQL schema building function
const { buildSchema } = require('graphql');

// Export the GraphQL schema definition
// This defines the structure of data and available operations
module.exports = buildSchema(`
    # Post type definition - represents a blog post or social media post
    type Post {
        _id: ID!           # Unique identifier (required)
        title: String!     # Post title (required)
        content: String!   # Post content/body (required)
        imageUrl: String!  # URL to associated image (required)
        creator: User!     # User who created the post (required, references User type)
        createdAt: String! # Timestamp when post was created (required)
        updatedAt: String! # Timestamp when post was last updated (required)
    }

    # User type definition - represents a user account
    type User {
        _id: ID!           # Unique identifier (required)
        name: String!      # User's display name (required)
        email: String!     # User's email address (required)
        password: String   # User's hashed password (optional for security)
        status: String!    # User's status message (required)
        posts: [Post!]!    # Array of posts created by this user (required, non-nullable array)
    }

    # Authentication data returned after successful login
    type AuthData {
        token: String!     # JWT authentication token (required)
        userId: String!    # ID of the authenticated user (required)
    }

    # Response type for posts query with pagination data
    type PostData {
        posts: [Post!]!    # Array of posts (required, non-nullable array)
        totalPosts: Int!   # Total number of posts for pagination (required)
    }

    # Input type for user registration
    # Input types are used for complex arguments in mutations
    input UserInputData {
        email: String!     # User's email (required)
        name: String!      # User's name (required)
        password: String!  # User's password (required)
    }

    # Input type for creating/updating posts
    input PostInputData {
        title: String!     # Post title (required)
        content: String!   # Post content (required)
        imageUrl: String!  # Image URL (required)
    }

    # Root Query type - defines all available read operations
    type RootQuery {
        # User authentication - returns token and user ID
        login(email: String!, password: String!): AuthData!
        # Get paginated list of posts - page parameter for pagination
        posts(page: Int): PostData!
        # Get single post by ID
        post(id: ID!): Post!
        # Get current user's information
        user: User!
    }

    # Root Mutation type - defines all available write operations
    type RootMutation {
        # Create a new user account
        createUser(userInput: UserInputData): User!
        # Create a new post
        createPost(postInput: PostInputData): Post!
        # Update an existing post
        updatePost(id: ID!, postInput: PostInputData): Post!
        # Delete a post (returns boolean success/failure)
        deletePost(id: ID!): Boolean
        # Update user's status message
        updateStatus(status: String!): User!
    }

    # Schema definition - specifies the root types
    schema {
        query: RootQuery      # Entry point for read operations
        mutation: RootMutation # Entry point for write operations
    }
`);
