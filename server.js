// server.js
// Backend entry: connects to MongoDB Atlas, exposes db via middleware, and defines routes.

const express = require('express');
const cors = require('cors');
const path = require('path');
const PropertiesReader = require('properties-reader');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Custom logger middleware
const loggerMiddleware = require('./middleware/logger');

const app = express();

// Basic app configuration
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);

// Request logging
app.use(loggerMiddleware);

// Read database connection info from properties file
const propertiesPath = path.resolve(__dirname, './dbconnection.properties');
const properties = PropertiesReader(propertiesPath);

// Database config pieces
const dbPrefix = properties.get('db.prefix');       // e.g., "mongodb+srv://"
const dbHost = properties.get('db.host');           // e.g., "@cluster0.xxx.mongodb.net/"
const dbName = properties.get('db.name');           // e.g., "bookmyclass"
const dbUser = properties.get('db.user');           // Atlas username
const dbPassword = properties.get('db.password');   // Atlas password
const dbParams = properties.get('db.params');       // e.g., "?retryWrites=true&w=majority"

// Build full MongoDB connection string step by step
const userAndPassword = `${dbUser}:${dbPassword}`;
const baseHost = `${dbPrefix}${userAndPassword}${dbHost}`;
const uri = `${baseHost}${dbParams}`;

// Create Mongo client
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

// Will hold the connected database reference
let db;

// Initialize database and start server
async function init() {
  try {
    // Connect to Atlas
    await client.connect();

    // Select our database by name
    db = client.db(dbName);
    console.log(`Connected to MongoDB Atlas. Database: ${db.databaseName}`);

    // Expose db and ObjectId to all routes via middleware
    app.use((req, _res, next) => {
      req.db = db;
      req.ObjectId = ObjectId;
      next();
    });

    // Health check
    app.get('/', (_req, res) => {
      res.json({ status: 'ok', database: db.databaseName });
    });

    // Lessons route (inline for now; can be moved to routes/lessons.js)
    app.get('/lessons', async (req, res, next) => {
      try {
        // Read sort parameters from query string
        const sortByParam = req.query.sortBy;
        const orderParam = req.query.order;

        // Decide the sort field (default to "topic" if not provided or invalid)
        const allowedFields = ['topic', 'location', 'price', 'space', 'id'];
        let sortField = 'topic';
        if (typeof sortByParam === 'string' && allowedFields.includes(sortByParam)) {
          sortField = sortByParam;
        }

        // Decide the sort order (default to ascending)
        let sortOrder = 1; // 1 = ascending, -1 = descending
        if (typeof orderParam === 'string' && orderParam.toLowerCase() === 'desc') {
          sortOrder = -1;
        }

        // Build the sort object for MongoDB
        const sortOptions = {};
        sortOptions[sortField] = sortOrder;

        // Query lessons with sorting
        const cursor = req.db.collection('lesson').find({});
        const items = await cursor.sort(sortOptions).toArray();

        res.json(items);
      } catch (err) {
        next(err);
      }
    });

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
