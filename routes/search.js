// routes/search.js
const express = require('express');
const router = express.Router();

// GET /search?q=term
router.get('/', async (req, res, next) => {
  try {
    const q = req.query.q;

    // Input validation
    if (!q || q.trim() === '') {
      return res.json({
        success: false,
        count: 0,
        data: [],
        error: 'Search query is required'
      });
    }

    const lessonsCollection = req.db.collection('lessons');
    let results;

    // If query length > 2, try text search (full-word match)
    if (q.length > 2) {
      results = await lessonsCollection.find(
        { $text: { $search: q } }
      ).toArray();
    }

    // If no text search results OR query is very short, use regex (partial match)
    if (!results || results.length === 0 || q.length <= 2) {
      const regex = new RegExp(q, 'i'); // case-insensitive

      // Special handling for rating (1–5) and price ("rs" prefix)
      const numericRating = parseInt(q);
      const isRatingSearch = !isNaN(numericRating) && numericRating >= 1 && numericRating <= 5;

      const priceMatch = q.toLowerCase().startsWith('rs')
        ? parseInt(q.replace(/[^0-9]/g, ''))
        : null;
      const isPriceSearch = priceMatch && priceMatch > 5;

      const orConditions = [
        { title: regex },
        { subject: regex },
        { location: regex },
        { description: regex },
        { category: regex },
        { professor: regex }
      ];

      if (isRatingSearch) {
        orConditions.push({ rating: numericRating });
      } else {
        orConditions.push({ rating: regex });
      }

      if (isPriceSearch) {
        orConditions.push({ price: priceMatch });
      } else {
        orConditions.push({ price: regex });
      }

      results = await lessonsCollection.find({ $or: orConditions }).toArray();
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      success: false,
      count: 0,
      data: [],
      error: 'Internal server error'
    });
    next(err);
  }
});

module.exports = router;
