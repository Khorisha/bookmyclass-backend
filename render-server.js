// render-server.js - This is for deploying to Render
const express = require('express');
const cors = require('cors');
const path = require('path');
const PropertiesReader = require('properties-reader');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Import my custom files
const loggerMiddleware = require('./middleware/logger');
const staticImages = require('./middleware/staticImages');
const lessonsRouter = require('./routes/lessons');
const searchRouter = require('./routes/search');
const ordersRouter = require('./routes/orders');

const app = express();

// Setup middleware
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);
app.use(loggerMiddleware);

// For serving images
staticImages(app);

let db;
let client;

async function connectToDatabase() {
  try {
    let connectionString;
    
    // Check if we're on Render 
    if (process.env.MONGODB_URI) {
      connectionString = process.env.MONGODB_URI;
      console.log('Using database connection from Render environment');
    } else {
      // Use the properties file for local testing
      const propertiesFile = path.resolve(__dirname, './dbconnection.properties');
      const props = PropertiesReader(propertiesFile);

      const prefix = props.get('db.prefix');
      const host = props.get('db.host');
      const dbName = props.get('db.name');
      const username = props.get('db.user');
      const password = props.get('db.password');
      const params = props.get('db.params');

      connectionString = `${prefix}${username}:${password}${host}${dbName}${params}`;
      console.log('Using database connection from properties file');
    }

    console.log('Trying to connect to MongoDB...');
    
    client = new MongoClient(connectionString, { 
      serverApi: ServerApiVersion.v1
    });

    await client.connect();
    db = client.db('bookmyclass');
    console.log('Successfully connected to MongoDB! Database: ' + db.databaseName);

    // Make sure search works properly
    try {
      await db.collection('lessons').createIndex({
        title: "text",
        subject: "text",
        location: "text",
        description: "text",
        category: "text",
        professor: "text"
      });
      console.log('Search index is ready');
    } catch (indexErr) {
      console.log('Search index already exists');
    }

    return db;

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Start everything
async function startApp() {
  try {
    await connectToDatabase();

    // Make database available to all routes
    app.use((req, res, next) => {
      req.db = db;
      req.ObjectId = ObjectId;
      next();
    });

    // Home page route
    app.get('/', (req, res) => {
      res.json({ 
        status: 'working', 
        database: db.databaseName,
        message: 'BookMyClass API is running',
        time: new Date().toISOString()
      });
    });

    // My API routes
    app.use('/lessons', lessonsRouter);
    app.use('/search', searchRouter);
    app.use('/orders', ordersRouter);

    // If someone tries a route that doesn't exist
    app.use((req, res) => {
      res.status(404).json({ error: 'Page not found' });
    });

    // Error handling
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Something went wrong' });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log('Server started on port ' + port);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startApp();