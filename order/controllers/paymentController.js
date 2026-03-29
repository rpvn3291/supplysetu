const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');

// Initialize Razorpay instance with the user's provided test keys
const razorpay = new Razorpay({
  key_id: 'rzp_test_SUNfXUR78kYFBd',
  key_secret: 'HBui9XgKGo74m2y4dzZfr2sG',
});

/**
 * @desc    Create a Razorpay Order
 * @route   POST /api/orders/create-payment
 * @access  Private
 */
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    res.status(400);
    throw new Error('Amount is required');
  }

  const options = {
    amount: Math.round(amount * 100), // Razorpay expects amount in smallest currency sub-unit (paise for INR)
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
    payment_capture: 1, // Auto-capture the payment
  };

  try {
    const response = await razorpay.orders.create(options);
    res.status(200).json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500);
    throw new Error('Failed to create Razorpay order');
  }
});

/**
 * @desc    Verify Razorpay Signature
 * @route   POST /api/orders/verify-payment
 * @access  Private
 */
const verifyPaymentSignature = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing Razorpay verification parameters');
  }

  const secret = 'HBui9XgKGo74m2y4dzZfr2sG';
  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    res.status(200).json({ success: true, message: 'Payment verified successfully' });
  } else {
    res.status(400);
    throw new Error('Invalid payment signature');
  }
});

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature,
};
