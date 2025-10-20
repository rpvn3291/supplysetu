// filename: validation/orderSchemas.js
import { z } from 'zod';

const createOrderSchema = z.object({
  body: z.object({
    orderItems: z.array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number({ invalid_type_error: "Quantity must be a number" }).int().positive('Quantity must be a positive number'),
        price: z.number({ invalid_type_error: "Price must be a number" }).positive('Price must be a positive number'),
        unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
      })
    ).min(1, 'Order must contain at least one item.'),
    
    totalPrice: z.number({ invalid_type_error: "Total price must be a number" }).positive('Total price must be a positive number'),
    supplierId: z.string().min(1, 'Supplier ID is required'),
    vendorLocationLat: z.number({ required_error: "Vendor latitude is required" }),
    vendorLocationLon: z.number({ required_error: "Vendor longitude is required" }),
    
    // Stricter definition for the weather object
    weatherAtOrder: z.object({}).passthrough(), // Ensures it's an object, but allows any properties
  }),
});

export { createOrderSchema };

