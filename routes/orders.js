// routes/orders.js
const express = require('express');
const router = express.Router();

// POST /orders - create a new order
router.post('/', async (req, res, next) => {
  try {
    const { customer, orderItems } = req.body;

    // Basic validation
    if (!customer || !orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Calculate total spaces
    const totalSpaces = orderItems.reduce((sum, item) => sum + item.spaces, 0);

    // Build order document
    const newOrder = {
      customer: {
        parentName: customer.parentName,
        phoneNumber: customer.phoneNumber
      },
      orderItems: orderItems.map(item => ({
        lessonID: item.lessonID,
        title: item.title,
        spaces: item.spaces,
        priceAtBooking: item.priceAtBooking,
        childInfo: {
          name: item.childInfo.name,
          age: item.childInfo.age,
          selectedDay: item.childInfo.selectedDay,
        }
      })),
      totalSpaces,
      createdAt: new Date().toISOString()
    };

    // Save to "orders" collection
    const result = await req.db.collection('orders').insertOne(newOrder);

    // Respond with confirmation
    res.json({
      message: 'Order created successfully',
      orderId: result.insertedId,
      order: newOrder
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
