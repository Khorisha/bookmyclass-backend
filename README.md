# BookMyClass - Backend Server

## Project Overview

Backend server for BookMyClass deployed on Render.com, providing REST API services for class bookings, order management, and search functionality. Built with Node.js, Express.js, and MongoDB Atlas using the native MongoDB driver.

## Project Links

- **Backend GitHub Repository**: https://github.com/Khorisha/bookmyclass-backend.git
- **Live API (Render.com)**: https://bookmyclass-backend.onrender.com

## Technology Stack

- **Server**: Node.js with Express.js
- **Database**: MongoDB Atlas
- **Database Driver**: Native MongoDB Node.js Driver
- **Deployment**: Render.com
- **Middleware**: CORS, Custom Logger, Static File Serving

## File Structure

```
bookmyclass-backend/
├── server.js                 # Main server file for local development
├── render-server.js          # Production server for Render deployment
├── middleware/
│   ├── logger.js            # Request logging middleware
│   └── staticImages.js      # Static file serving middleware
├── routes/
│   ├── lessons.js           # Lessons API routes
│   ├── orders.js            # Orders API routes
│   └── search.js            # Search API routes
├── public/
│   ├── lesson-icons/        # Subject icon images
│   └── assets/              # General assets (banners, etc.)
├── dbconnection.properties  # Database configuration
├── package.json
├── package-lock.json
└── README.md
```

## API Endpoints

### Core Endpoints

#### GET /lessons
- Returns all lessons from the database as JSON array
- Uses MongoDB find operation to retrieve all documents
- Handles errors with try-catch and next() for error middleware

#### POST /orders
- Creates new orders with customer information and order items
- Validates required fields (customer and orderItems)
- Calculates totalSpaces and totalAmount automatically
- Builds order document with customer details, child information, and timestamps
- Returns success response with MongoDB _id as orderId

#### PUT /lessons/:id
- Updates lesson information with field whitelist security
- **Allowed Update Fields**: sessionsBooked, discounted, discountPercent, discountStart, discountEnd, price, description, rating, professor
- Filters request body to only include permitted fields
- Validates that at least one valid field is provided
- Checks if lesson exists before updating
- Returns the complete updated lesson object

#### GET /search?q=term
- Implements hybrid search functionality
- Uses MongoDB text search for queries longer than 2 characters
- Falls back to regex search for shorter queries or no results
- Special handling for rating searches (1-5) and price searches ("rs" prefix)
- Searches across multiple fields: title, subject, location, description, category, professor
- Returns structured response with success status and count

### Static File Endpoints

#### GET /lesson-icons/
- Serves subject icons from /public/lesson-icons/ directory
- Returns 404 error with JSON message for missing files

#### GET /assets/
- Serves general assets from /public/assets/ directory
- Returns 404 error with JSON message for missing files

## Middleware

### Logger Middleware
- Logs each incoming request with timestamp, method, and URL
- Uses readable timestamp format with toLocaleString()
- Calls next() to continue request processing

### Static Images Middleware
- Configures Express static file serving for lesson-icons and assets
- Sets up custom error handlers for missing static files
- Returns JSON error responses for 404 cases

## Database Configuration

### Connection Management
- Supports both Render.com environment variables and local properties file
- Uses MongoDB Connection String URI format
- Implements ServerApiVersion.v1 for MongoDB driver
- Creates text indexes on lesson collection for search functionality

## Search Implementation

### Text Index
- Created automatically on server startup
- Indexes fields: title, subject, location, description, category, professor
- Handles duplicate index creation gracefully

### Search Strategy
- **Text Search**: For queries > 2 characters, uses $text operator
- **Regex Search**: For shorter queries or no results, uses case-insensitive regex
- **Special Cases**: 
  - Numeric rating searches (1-5)
  - Price searches with "rs" prefix
  - Multiple field coverage with $or conditions

## Order Processing

### Order Structure
- Customer object with parentName and phoneNumber
- OrderItems array with lessonID, title, spaces, priceAtBooking
- ChildInfo with name, age, and selectedDay
- Automatic calculation of totalSpaces and totalAmount
- Status tracking and createdAt timestamp

### Validation
- Checks for required customer and orderItems fields
- Validates orderItems array is not empty
- Provides meaningful error responses

## Error Handling

### HTTP Status Codes
- 200: Successful operations
- 400: Bad request (validation errors, no valid fields)
- 404: Resource not found (lessons, orders, static files)
- 500: Internal server errors

### Error Responses
- Consistent JSON error format
- Console logging for server-side debugging
- Proper error propagation through next()

## Deployment

### Render.com Configuration
- Uses render-server.js as entry point
- Environment variable MONGODB_URI for production
- Health check endpoint at root path /
- Automatic port binding with process.env.PORT

### Local Development
- Uses server.js with properties file configuration
- Localhost:3000 default port
- Development-focused logging and configuration

## Package Dependencies

### Production Dependencies
- express: ^5.1.0
- mongodb: ^7.0.0
- cors: ^2.8.5
- properties-reader: ^2.3.0

### Development Dependencies
- nodemon: ^3.1.11

## Scripts
- start: node render-server.js (for Render)
- dev: nodemon server.js (for local development)
- local: node server.js (for local production)

