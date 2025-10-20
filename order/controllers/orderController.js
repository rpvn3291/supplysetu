// filename: controllers/orderController.js
import { PrismaClient } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { publishToQueue } from '../amqp/connection.js'; // For publishing events
import fetch from 'node-fetch'; // For inter-service communication

const prisma = new PrismaClient();

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private/Vendor
 */
const createOrder = asyncHandler(async (req, res) => {
  // Destructure all the new fields from the request body
  const { 
    orderItems, 
    totalPrice, 
    supplierId, 
    vendorLocationLat, 
    vendorLocationLon, 
    weatherAtOrder 
  } = req.body;
  
  const vendorId = req.user.id; // From authMiddleware

  const order = await prisma.order.create({
    data: {
      vendorId,
      totalPrice,
      supplierId,
      vendorLocationLat,
      vendorLocationLon,
      weatherAtOrder,
      orderItems: {
        create: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          unitOfMeasure: item.unitOfMeasure,
        })),
      },
    },
    include: {
      orderItems: true,
    },
  });

  // --- Publish an event to RabbitMQ after creating the order ---
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

/**
 * @desc    Get incoming orders for a supplier's products
 * @route   GET /api/orders/incoming
 * @access  Private/Supplier
 */
const getIncomingOrders = asyncHandler(async (req, res) => {
  const token = req.headers.authorization;

  const productResponse = await fetch(`${process.env.PRODUCT_API_URL}/api/products/supplier`, {
    headers: { 'Authorization': token },
  });
  
  if (!productResponse.ok) {
    throw new Error('Could not fetch products for supplier from Product service');
  }
  
  const supplierProducts = await productResponse.json();
  const productIds = supplierProducts.map(p => p._id);

  if (productIds.length === 0) {
    return res.json([]);
  }

  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId: { in: productIds },
    },
    include: {
      order: true,
    },
     orderBy: {
      order: {
        createdAt: 'desc'
      }
    }
  });

  res.status(200).json(orderItems);
});


export {
  createOrder,
  getMyOrders,
  getIncomingOrders
};

