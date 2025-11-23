// routes/orders.js
const express = require('express');
const router = express.Router();

// POST /orders - create a new order
router.post('/', async (req, res, next) => {
  try {
    const { customer, orderItems, receiptId } = req.body;

    // Basic validation
    if (!customer || !orderItems || orderItems.length === 0 || !receiptId) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Calculate total spaces and total amount
    const totalSpaces = orderItems.reduce((sum, item) => sum + item.spaces, 0);
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.priceAtBooking * item.spaces), 0);

    // Build order document - FIXED: Ensure all fields are properly included
    const newOrder = {
      orderId: receiptId,  // This should be stored as orderId
      receiptId: receiptId, // Also store as receiptId for consistency
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
      totalAmount,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    console.log('Saving order to database:', newOrder); // Debug log

    // Save to "orders" collection
    const result = await req.db.collection('orders').insertOne(newOrder);

    console.log('MongoDB insert result:', result); // Debug log

    // Verify the saved document
    const savedOrder = await req.db.collection('orders').findOne({ _id: result.insertedId });
    console.log('Saved order from database:', savedOrder); // Debug log

    // Respond with confirmation
    res.json({
      message: 'Order created successfully',
      orderId: receiptId,
      receiptId: receiptId,
      order: newOrder,
      savedToDatabase: savedOrder // Include for debugging
    });
  } catch (err) {
    console.error('Error creating order:', err);
    next(err);
  }
});

// GET /orders - return all orders (for testing)
router.get('/', async (req, res, next) => {
  try {
    const orders = await req.db.collection('orders').find({}).toArray();
    console.log('All orders from database:', orders); // Debug log
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

module.exports = router;