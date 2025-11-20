// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const PropertiesReader = require('properties-reader');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);
app.use(morgan('dev'));

// Read DB properties
const propertiesPath = path.resolve(__dirname, './dbconnection.properties');
const properties = PropertiesReader(propertiesPath);

const dbPrefix = properties.get('db.prefix');
const dbHost = properties.get('db.host');
const dbName = properties.get('db.name');
const dbUser = properties.get('db.user');
const dbPassword = properties.get('db.password');
const dbParams = properties.get('db.params');

const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db;

async function init() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to MongoDB Atlas, database: ${db.databaseName}`);

    // Expose db and ObjectId to all routes via middleware
    app.use((req, _res, next) => {
      req.db = db;
      req.ObjectId = ObjectId;
      next();
    });

    // Simple health check route
    app.get('/', (_req, res) => {
      res.json({ status: 'ok', db: db.databaseName });
    });

    // Example lessons route (temporary inline; you’ll move to routers)
    app.get('/lessons', async (req, res, next) => {
      try {
        const { sortBy = 'topic', order = 'asc' } = req.query;
        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        const items = await req.db.collection('lesson').find({}).sort(sort).toArray();
        res.json(items);
      } catch (err) {
        next(err);
      }
    });

    // Global 404
    app.use((req, res) => {
      res.status(404).json({ error: 'Resource not found' });
    });

    // Global error handler
    app.use((err, _req, res, _next) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred' });
    });

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
