// routes/lessons.js
const express = require('express');
const router = express.Router();

// GET /lessons - return all lessons from the database
router.get('/', async (req, res, next) => {
  try {
    // Get all documents from the "lessons" collection
    const lessons = await req.db.collection('lessons').find({}).toArray();

    // Send them back as JSON
    res.json(lessons);
  } catch (err) {
    // Pass any errors to the error handler
    next(err);
  }
});

module.exports = router;
