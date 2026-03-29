import mongoose from 'mongoose';

const bulkOrderSchema = new mongoose.Schema({
  pincode: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  supplierId: { type: String, required: true },
  initiator: { type: String, required: true },
  commitments: {
    type: Map,
    of: Number,
    default: {}
  },
  total: { type: Number, default: 0 },
}, { timestamps: true });

const BulkOrder = mongoose.model('BulkOrder', bulkOrderSchema);
export default BulkOrder;
