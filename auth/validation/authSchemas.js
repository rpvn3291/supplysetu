// filename: validation/authSchemas.js
import { z } from 'zod';

// --- Vendor and Supplier specific profile schemas ---
const vendorProfileSchema = z.object({
  firstName: z.string({ required_error: 'First name is required' }),
  lastName: z.string({ required_error: 'Last name is required' }),
  address: z.string({ required_error: 'Address is required' }),
  pincode: z.string({ required_error: 'Pincode is required' }).length(6, 'Pincode must be 6 digits'),
  phoneNumber: z.string({ required_error: 'Phone number is required' }),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
  foodType: z.string({ required_error: 'Food type is required' }),
  // --- CORRECTED: Defines an object with string keys and string values ---
  operatingHours: z.record(z.string(), z.string()), 
});

const supplierProfileSchema = z.object({
  companyName: z.string({ required_error: 'Company name is required' }),
  warehouseAddress: z.string({ required_error: 'Warehouse address is required' }),
  pincode: z.string({ required_error: 'Pincode is required' }).length(6, 'Pincode must be 6 digits'),
  contactPerson: z.string({ required_error: 'Contact person is required' }),
  gstId: z.string({ required_error: 'GST ID is required' }),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
  // --- CORRECTED: Defines an array of strings, with a minimum length of 1 ---
  deliveryVehicles: z.array(z.string()).min(1, 'At least one delivery vehicle is required'),
  minOrderValue: z.number({ required_error: 'Minimum order value is required' }).nonnegative(),
});


// --- Main Registration Schema using a Discriminated Union ---
const registerSchema = z.object({
  body: z.discriminatedUnion("role", [
    z.object({
      role: z.literal("VENDOR"),
      email: z.string().email('Invalid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
      profileData: vendorProfileSchema,
    }),
    z.object({
      role: z.literal("SUPPLIER"),
      email: z.string().email('Invalid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
      profileData: supplierProfileSchema,
    }),
  ]),
});


// --- Login schema remains unchanged ---
const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});


export {
  registerSchema,
  loginSchema,
};

