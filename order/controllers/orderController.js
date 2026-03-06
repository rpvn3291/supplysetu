import { PrismaClient } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { publishToQueue } from '../amqp/connection.js'; 
import fetch from 'node-fetch';

const prisma = new PrismaClient();

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private/Vendor (Exclusive to Mobile App)
 */
const createOrder = asyncHandler(async (req, res) => {
  const { 
    orderItems, 
    totalPrice, 
    supplierId, 
    vendorLocationLat, 
    vendorLocationLon, 
    weatherAtOrder 
  } = req.body;
  
  const vendorId = req.user.id;

  const order = await prisma.order.create({
    data: {
      vendorId,
      totalPrice,
      supplierId,
      vendorLocationLat,
      vendorLocationLon,
      weatherAtOrder: weatherAtOrder || {},
      orderItems: {
        create: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          unitOfMeasure: item.unitOfMeasure || 'unit',
        })),
      },
    },
    include: {
      orderItems: true,
    },
  });

  // Publish event to RabbitMQ for inventory management
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
    console.error('Failed to publish order.created event:', error);
  }

  res.status(201).json(order);
});

/**
 * @desc    Get orders for the logged-in vendor
 * @route   GET /api/orders/myorders
 * @access  Private/Vendor (Exclusive to Mobile App)
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

/**
 * @desc    Get incoming orders for a supplier
 * @route   GET /api/orders/incoming
 * @access  Private/Supplier (Exclusive to Website Dashboard)
 */
const getIncomingOrders = asyncHandler(async (req, res) => {
  // We query by supplierId to ensure the supplier only sees their own business
  const orders = await prisma.order.findMany({
    where: {
      supplierId: req.user.id, 
    },
    include: {
      orderItems: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.status(200).json(orders);
});

/**
 * @desc    Update Order Status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Supplier (Exclusive to Website Dashboard)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // IMPORTANT: The status must match the Prisma Schema Enum exactly.
  // In your schema, the value is 'CONFIRMED', not 'ACCEPTED'.
  const allowedStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  
  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Use one of: ${allowedStatuses.join(', ')}`);
  }

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Security: Ensure this supplier is the one assigned to the order
  if (order.supplierId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: id },
    data: { status: status },
    include: { orderItems: true }
  });

  res.status(200).json(updatedOrder);
});

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private (Mobile or Web)
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevents crashes if route ordering is incorrect in Express
  if (id === 'incoming' || id === 'myorders') {
    return res.status(400).json({ message: "Incorrect route usage" });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { orderItems: true },
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Security: Check if user belongs to this order (as Vendor or Supplier)
  if (order.vendorId !== req.user.id && order.supplierId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.status(200).json(order);
});

export { 
  createOrder, 
  getMyOrders, 
  getIncomingOrders, 
  getOrderById, 
  updateOrderStatus 
};