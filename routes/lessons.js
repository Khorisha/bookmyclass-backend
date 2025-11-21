// routes/lessons.js
const express = require('express');
const router = express.Router();

// Allowed fields for updates for PUT /lessons/:id
const allowedUpdates = [
  'students',
  'spaces',
  'discounted',
  'discountPercent',
  'discountStart',
  'discountEnd',
  'price',
  'description',
  'rating',
  'professor'
];

// GET /lessons - return all lessons
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
    const newLesson = req.body;
    const result = await req.db.collection('lessons').insertOne(newLesson);
    res.json({ message: 'Lesson added successfully', id: result.insertedId });
  } catch (err) {
    next(err);
  }
});

// DELETE /lessons/:id - delete a lesson by id
router.delete('/:id', async (req, res, next) => {
  try {
    const lessonId = req.params.id;
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

// PUT /lessons/:id - update allowed attributes of a lesson
router.put('/:id', async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const updates = {};

    // Only include allowed fields
    for (const key of Object.keys(req.body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await req.db.collection('lessons').updateOne(
      { id: lessonId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const updatedLesson = await req.db.collection('lessons').findOne({ id: lessonId });
    res.json(updatedLesson);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
