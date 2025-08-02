# GraphQL Social Media Backend

A full-featured GraphQL API backend for a social media application built with Node.js, Express, and MongoDB. This project demonstrates modern backend development practices including authentication, file uploads, pagination, and comprehensive error handling.

## 🚀 Features

- **GraphQL API**: Complete GraphQL implementation with queries and mutations
- **User Authentication**: JWT-based authentication system
- **File Upload**: Image upload functionality with multer
- **Pagination**: Efficient pagination for post listings
- **Authorization**: Role-based access control for CRUD operations
- **Input Validation**: Comprehensive input validation using validator.js
- **Error Handling**: Centralized error handling with custom error codes
- **Database Relations**: MongoDB document relationships between users and posts
- **CORS Support**: Cross-origin resource sharing for frontend integration

## 🛠️ Tech Stack

### Backend Framework
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **GraphQL** - Query language and runtime for APIs
- **express-graphql** - GraphQL middleware for Express

### Database
- **MongoDB** - NoSQL document database
- **Mongoose** - MongoDB object modeling for Node.js

### Authentication & Security
- **JWT (jsonwebtoken)** - JSON Web Token authentication
- **bcryptjs** - Password hashing and comparison
- **validator** - Input validation library

### File Handling
- **multer** - Middleware for handling multipart/form-data (file uploads)
- **fs** - File system operations

### Development Tools
- **nodemon** - Development server with auto-restart

## 📁 Project Structure

```
11-backend-fixing-a-pagination-bug/
├── app.js                  # Main application entry point
├── package.json           # Dependencies and scripts
├── controllers/           # REST controllers (legacy)
│   ├── auth.js
│   └── feed.js
├── graphql/              # GraphQL implementation
│   ├── schema.js         # GraphQL schema definitions
│   └── resolvers.js      # GraphQL resolver functions
├── middleware/           # Custom middleware
│   └── auth.js          # JWT authentication middleware
├── models/              # MongoDB data models
│   ├── user.js         # User schema and model
│   └── post.js         # Post schema and model
├── util/               # Utility functions
│   └── file.js        # File system utilities
└── images/            # Uploaded image storage
```

## 🗄️ Data Models

### User Model
```javascript
{
  _id: ObjectId,
  email: String (required, unique),
  password: String (required, hashed),
  name: String (required),
  status: String (default: "I am new!"),
  posts: [ObjectId] (references to Post documents)
}
```

### Post Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  content: String (required),
  imageUrl: String (required),
  creator: ObjectId (required, references User),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 11-backend-fixing-a-pagination-bug
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Create a MongoDB Atlas account or use local MongoDB
   - Update the connection string in `app.js` with your MongoDB URI
   ```javascript
   mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>
   ```

4. **Create images directory**
   ```bash
   mkdir images
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:8080`

## 📡 API Endpoints

### GraphQL Endpoint
- **URL**: `http://localhost:8080/graphql`
- **GraphiQL**: Available at the same URL for interactive queries

### REST Endpoints
- **POST** `/post-image` - Upload image files (requires authentication)

## 🔍 GraphQL Schema

### Types

#### User
```graphql
type User {
  _id: ID!
  name: String!
  email: String!
  status: String!
  posts: [Post!]!
}
```

#### Post
```graphql
type Post {
  _id: ID!
  title: String!
  content: String!
  imageUrl: String!
  creator: User!
  createdAt: String!
  updatedAt: String!
}
```

#### AuthData
```graphql
type AuthData {
  token: String!
  userId: String!
}
```

#### PostData (for pagination)
```graphql
type PostData {
  posts: [Post!]!
  totalPosts: Int!
}
```

### Queries

#### Login
```graphql
query {
  login(email: "user@example.com", password: "password") {
    token
    userId
  }
}
```

#### Get Posts (with pagination)
```graphql
query {
  posts(page: 1) {
    posts {
      _id
      title
      content
      imageUrl
      creator {
        name
        email
      }
      createdAt
      updatedAt
    }
    totalPosts
  }
}
```

#### Get Single Post
```graphql
query {
  post(id: "POST_ID") {
    _id
    title
    content
    imageUrl
    creator {
      name
      email
    }
    createdAt
    updatedAt
  }
}
```

#### Get Current User
```graphql
query {
  user {
    _id
    name
    email
    status
    posts {
      _id
      title
    }
  }
}
```

### Mutations

#### Create User (Registration)
```graphql
mutation {
  createUser(userInput: {
    email: "user@example.com"
    name: "John Doe"
    password: "password123"
  }) {
    _id
    name
    email
  }
}
```

#### Create Post
```graphql
mutation {
  createPost(postInput: {
    title: "My First Post"
    content: "This is the content of my post"
    imageUrl: "images/2024-01-01-image.jpg"
  }) {
    _id
    title
    content
    creator {
      name
    }
    createdAt
  }
}
```

#### Update Post
```graphql
mutation {
  updatePost(
    id: "POST_ID"
    postInput: {
      title: "Updated Title"
      content: "Updated content"
      imageUrl: "images/updated-image.jpg"
    }
  ) {
    _id
    title
    content
    updatedAt
  }
}
```

#### Delete Post
```graphql
mutation {
  deletePost(id: "POST_ID")
}
```

#### Update Status
```graphql
mutation {
  updateStatus(status: "I'm learning GraphQL!") {
    _id
    status
  }
}
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected resources:

1. **Register a new user** using the `createUser` mutation
2. **Login** using the `login` query to receive a JWT token
3. **Include the token** in the Authorization header for subsequent requests:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### Protected Operations
- All queries except `login`
- All mutations except `createUser`
- Image upload endpoint

## 📄 Pagination

Posts are paginated with 2 posts per page (configurable in `resolvers.js`). The `posts` query accepts an optional `page` parameter:

```graphql
query {
  posts(page: 2) {
    posts { ... }
    totalPosts
  }
}
```

- `page`: Page number (defaults to 1)
- `totalPosts`: Total number of posts (for calculating pagination)

## 🖼️ File Upload

Image uploads are handled through a separate REST endpoint due to GraphQL limitations with file uploads:

1. **Upload image** via POST to `/post-image`
2. **Receive file path** in response
3. **Use file path** in GraphQL mutations

Example upload with curl:
```bash
curl -X PUT \
  http://localhost:8080/post-image \
  -H 'Authorization: Bearer <your-token>' \
  -F 'image=@/path/to/your/image.jpg'
```

## ⚠️ Error Handling

The API provides comprehensive error handling with standardized error responses:

- **400**: Validation errors
- **401**: Authentication errors
- **403**: Authorization errors
- **404**: Resource not found
- **422**: Input validation errors
- **500**: Server errors

Error Response Format:
```json
{
  "message": "Error description",
  "status": 422,
  "data": [
    {
      "message": "Specific validation error"
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables
Consider creating a `.env` file for sensitive configuration:
```env
DB_CONNECTION_STRING=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=8080
```

### Customizable Settings
- **Pagination size**: Change `perPage` in `resolvers.js`
- **JWT expiration**: Modify `expiresIn` in login resolver
- **File upload limits**: Configure multer settings in `app.js`
- **CORS origins**: Update CORS configuration for production

## 🚀 Deployment

1. **Set environment variables** for production
2. **Update MongoDB connection** string
3. **Configure file upload directory** permissions
4. **Set up reverse proxy** (nginx) if needed
5. **Enable HTTPS** for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Known Issues

- Database connection string is hardcoded (should use environment variables)
- JWT secret is hardcoded (should use environment variables)
- File uploads are stored locally (consider cloud storage for production)

## 🔮 Future Enhancements

- [ ] Add user profile images
- [ ] Implement post likes/reactions
- [ ] Add comment system
- [ ] Implement real-time subscriptions
- [ ] Add search functionality
- [ ] Implement user following system
- [ ] Add email verification
- [ ] Implement rate limiting
- [ ] Add comprehensive testing suite
