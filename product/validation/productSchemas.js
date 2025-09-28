// filename: validation/productSchemas.js
const { z } = require('zod');

// Schema for creating a new product. All fields are required.
const createProductSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(3, 'Name must be at least 3 characters long'),
    description: z.string({ required_error: 'Description is required' }).min(10, 'Description must be at least 10 characters long'),
    price: z.number({ required_error: 'Price is required' }).positive('Price must be a positive number'),
    category: z.string({ required_error: 'Category is required' }),
    unit: z.string({ required_error: 'Unit is required' }),
    stock: z.number({ required_error: 'Stock is required' }).int().nonnegative('Stock cannot be negative'),
    imageUrl: z.string().url('Image URL must be a valid URL').optional(),
  }),
});

// Schema for updating a product. All fields are optional.
const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters long').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters long').optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    category: z.string().optional(),
    unit: z.string().optional(),
    stock: z.number().int().nonnegative('Stock cannot be negative').optional(),
    imageUrl: z.string().url('Image URL must be a valid URL').optional(),
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};
