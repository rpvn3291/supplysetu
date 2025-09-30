const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const prisma = new PrismaClient();
const { publishToQueue } = require('../amqp/connection'); // Import the publisher

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private/Vendor
 */
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, totalPrice } = req.body;
  const vendorId = req.user.id; // From authMiddleware

  const order = await prisma.order.create({
    data: {
      vendorId,
      totalPrice,
      orderItems: {
        create: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      orderItems: true, // Include the created items in the response
    },
  });
  
  // --- NEW: Publish an event to RabbitMQ after creating the order ---
  try {
    const eventPayload = {
      orderId: order.id,
      items: order.orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };
    publishToQueue('order.created', eventPayload);
  } catch (error) {
    // It's important to only log this error and not crash the request.
    // The order was created successfully, even if the message failed to send.
    console.error('Failed to publish order.created event:', error);
  }

  res.status(201).json(order);
});

const getMyOrders = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const orders = await prisma.order.findMany({
        where: { vendorId },
        include: { orderItems: true },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(orders);
});

// --- NEW FUNCTION ---
/**
 * @desc    Get incoming orders for a supplier's products
 * @route   GET /api/orders/incoming
 * @access  Private/Supplier
 */
const getIncomingOrders = asyncHandler(async (req, res) => {
  const token = req.headers.authorization; // We need the token to pass to the next service

  // 1. Call the Product service to get the supplier's product IDs
  // This is the inter-service communication step.
  const productResponse = await fetch(`${process.env.PRODUCT_API_URL}/api/products/supplier`, {
    headers: { 'Authorization': token },
  });
  
  if (!productResponse.ok) {
    throw new Error('Could not fetch products for supplier from Product service');
  }
  
  const supplierProducts = await productResponse.json();
  const productIds = supplierProducts.map(p => p._id);

  if (productIds.length === 0) {
    return res.json([]); // Return an empty array if the supplier has no products
  }

  // 2. Find all order items in our database that match the supplier's product IDs
  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId: { in: productIds },
    },
    include: {
      order: true, // Include the parent order details for context
    },
     orderBy: {
      order: {
        createdAt: 'desc'
      }
    }
  });

  res.status(200).json(orderItems);
});


module.exports = {
  createOrder,
  getMyOrders,
  getIncomingOrders, // Export the new function
};

