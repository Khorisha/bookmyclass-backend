// server.js
// Backend entry: connects to MongoDB Atlas, exposes db via middleware, and mounts routes.

const express = require('express');
const cors = require('cors');
const path = require('path');
const PropertiesReader = require('properties-reader');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Custom logger middleware
const loggerMiddleware = require('./middleware/logger');

// Static image middleware
const staticImages = require('./middleware/staticImages');

// Import routers
const lessonsRouter = require('./routes/lessons');
const searchRouter = require('./routes/search');
const ordersRouter = require('./routes/orders');

const app = express();

// Basic app configuration
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);

// Request logging
app.use(loggerMiddleware);

// Static image serving (lesson-icons + assets)
staticImages(app);

// Read database connection info from properties file
const propertiesPath = path.resolve(__dirname, './dbconnection.properties');
const properties = PropertiesReader(propertiesPath);

const dbPrefix = properties.get('db.prefix');
const dbHost = properties.get('db.host');
const dbName = properties.get('db.name');       // e.g., "bookmyclass"
const dbUser = properties.get('db.user');       // Atlas username
const dbPassword = properties.get('db.password'); // Atlas password
const dbParams = properties.get('db.params');   // e.g., "?retryWrites=true&w=majority"

// Build MongoDB connection string
const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db;

// Initialize database and start server
async function init() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to MongoDB Atlas. Database: ${db.databaseName}`);

    // Ensure text index exists for search 
    await db.collection('lessons').createIndex({
      title: "text",
      subject: "text",
      location: "text",
      description: "text",
      category: "text",
      professor: "text"
    });

    // Expose db and ObjectId to all routes
    app.use((req, _res, next) => {
      req.db = db;
      req.ObjectId = ObjectId;
      next();
    });

    // Health check route
    app.get('/', (_req, res) => {
      res.json({ status: 'ok', database: db.databaseName });
    });

    // Mount routers
    app.use('/lessons', lessonsRouter);
    app.use('/search', searchRouter);
    app.use('/orders', ordersRouter);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Resource not found' });
    });

    // Global error handler
    app.use((err, _req, res, _next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start HTTP server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

init();
