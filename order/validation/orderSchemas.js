// filename: validation/orderSchemas.js
const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    orderItems: z.array(
      z.object({
        productId: z.string({ required_error: 'Product ID is required' }),
        quantity: z.number({ required_error: 'Quantity is required' }).int().positive(),
        price: z.number({ required_error: 'Price is required' }).positive(),
      })
    ).min(1, 'Order must contain at least one item.'),
    totalPrice: z.number({ required_error: 'Total price is required' }).positive(),
  }),
});

module.exports = { createOrderSchema };
