const express = require('express');
const path = require('path');

function staticImages(app) {
  // Serve lesson icons (named after subject in lowercase)
  app.use('/lesson-icons', express.static(path.join(__dirname, '../public/lesson-icons')));

  // Serve general assets (banner, logos, etc.)
  app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

  // Error handlers for missing files
  app.use('/lesson-icons', (req, res) => {
    res.status(404).json({ error: 'Lesson icon not found' });
  });

  app.use('/assets', (req, res) => {
    res.status(404).json({ error: 'Asset not found' });
  });
}

module.exports = staticImages;
