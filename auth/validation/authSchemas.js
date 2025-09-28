// filename: validation/authSchemas.js
const { z } = require('zod');

// --- Reusable Profile Schemas ---

const vendorProfileSchema = z.object({
  firstName: z.string({ required_error: 'First name is required' }).min(2, 'First name is too short'),
  lastName: z.string({ required_error: 'Last name is required' }).min(2, 'Last name is too short'),
  address: z.string({ required_error: 'Address is required' }),
  pincode: z.string({ required_error: 'Pincode is required' }).length(6, 'Pincode must be 6 digits'),
  phoneNumber: z.string({ required_error: 'Phone number is required' }).min(10, 'Phone number must be at least 10 digits'),
});

const supplierProfileSchema = z.object({
  companyName: z.string({ required_error: 'Company name is required' }),
  warehouseAddress: z.string({ required_error: 'Warehouse address is required' }),
  pincode: z.string({ required_error: 'Pincode is required' }).length(6, 'Pincode must be 6 digits'),
  contactPerson: z.string({ required_error: 'Contact person is required' }),
  gstId: z.string({ required_error: 'GST ID is required' }),
});


// --- Main Request Schemas ---

// This uses a "discriminated union", a powerful Zod feature for conditional validation.
// It validates profileData based on the literal value of the 'role' field.
const registerBodySchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('VENDOR'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
    profileData: vendorProfileSchema,
  }),
  z.object({
    role: z.literal('SUPPLIER'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
    profileData: supplierProfileSchema,
  }),
]);

const registerSchema = z.object({
  body: registerBodySchema,
});


const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};

