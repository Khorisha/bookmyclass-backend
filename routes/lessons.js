// routes/lessons.js
const express = require('express');
const router = express.Router();

// GET /lessons - return all lessons from the database
router.get('/', async (req, res, next) => {
  try {
    const lessons = await req.db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (err) {
    next(err);
  }
});

// POST /lessons - add a new lesson
router.post('/', async (req, res, next) => {
  try {
    const newLesson = req.body; // lesson data comes from request body
    const result = await req.db.collection('lessons').insertOne(newLesson);
    res.json({ message: 'Lesson added successfully', id: result.insertedId });
  } catch (err) {
    next(err);
  }
});

// DELETE /lessons/:id - delete a lesson by id
router.delete('/:id', async (req, res, next) => {
  try {
    const lessonId = req.params.id; // id comes from URL
    const result = await req.db.collection('lessons').deleteOne({ id: lessonId });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Lesson not found' });
    } else {
      res.json({ message: 'Lesson deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
