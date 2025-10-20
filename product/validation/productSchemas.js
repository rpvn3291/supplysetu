// filename: validation/productSchemas.js
import { z } from 'zod';

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string().min(10),
    price: z.number().positive(),
    category: z.enum(['Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Spices', 'Groceries', 'Disposables', 'Other']),
    unit: z.string(),
    stock: z.number().int().nonnegative(),
    imageUrl: z.string().url().optional(),
    
    // --- NEW REQUIRED FIELDS ---
    supplierName: z.string(),
    supplierLocationLat: z.number(),
    supplierLocationLon: z.number(),
    isVerified: z.boolean(),
    // qualityRating and unitConversionFactor have defaults, so they are not required from the client
  }),
});

// Update schema can remain as it is, assuming these fields are not updatable this way
const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    category: z.enum(['Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Spices', 'Groceries', 'Disposables', 'Other']).optional(),
    unit: z.string().optional(),
    stock: z.number().int().nonnegative().optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export {
  createProductSchema,
  updateProductSchema,
};

