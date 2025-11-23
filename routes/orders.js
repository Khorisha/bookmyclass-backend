// routes/orders.js
const express = require('express');
const router = express.Router();

// POST /orders - create a new order
router.post('/', async (req, res, next) => {
  try {
    const { customer, orderItems } = req.body;

    // Validate required fields
    if (!customer || !orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Calculate totals
    const totalSpaces = orderItems.reduce((sum, item) => sum + (item.spaces || 0), 0);
    const totalAmount = orderItems.reduce((sum, item) => sum + ((item.priceAtBooking || 0) * (item.spaces || 0)), 0);

    // Build order document
    const newOrder = {
      customer: {
        parentName: customer.parentName || '',
        phoneNumber: customer.phoneNumber || ''
      },
      orderItems: orderItems.map(item => ({
        lessonID: item.lessonID,
        title: item.title,
        spaces: item.spaces,
        priceAtBooking: item.priceAtBooking,
        childInfo: {
          name: item.childInfo?.name || '',
          age: item.childInfo?.age || '',
          selectedDay: item.childInfo?.selectedDay || '',
        }
      })),
      totalSpaces,
      totalAmount,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Save to database
    const result = await req.db.collection('orders').insertOne(newOrder);
    const savedOrder = await req.db.collection('orders').findOne({ _id: result.insertedId });

    // Return response with MongoDB _id as orderId
    res.json({
      success: true,
      message: 'Order created successfully',
      orderId: savedOrder._id, // Use MongoDB _id as orderId
      order: savedOrder
    });
  } catch (err) {
    console.error('Error creating order:', err);
    next(err);
  }
});

// GET /orders - return all orders
router.get('/', async (req, res, next) => {
  try {
    const orders = await req.db.collection('orders').find({}).toArray();
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    next(err);
  }
});

// GET /orders/:id - get order by MongoDB _id
router.get('/:id', async (req, res, next) => {
  try {
    const { ObjectId } = require('mongodb');
    const order = await req.db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    next(err);
  }
});

module.exports = router;