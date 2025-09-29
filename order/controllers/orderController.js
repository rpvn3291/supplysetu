// filename: controllers/orderController.js
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const prisma = new PrismaClient();

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

  res.status(201).json(order);
});

/**
 * @desc    Get orders for the logged-in vendor
 * @route   GET /api/orders/myorders
 * @access  Private/Vendor
 */
const getMyOrders = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;

    const orders = await prisma.order.findMany({
        where: { vendorId },
        include: { orderItems: true },
        orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(orders);
});

module.exports = {
  createOrder,
  getMyOrders,
};

