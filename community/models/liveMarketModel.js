import mongoose from 'mongoose';

const liveMarketSchema = new mongoose.Schema({
  marketId: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  supplierId: { type: String, required: true },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, required: true },
  startTime: { type: Date, default: Date.now },
  duration: { type: Number, required: true },
  purchases: [{
    userId: String,
    userEmail: String,
    quantity: Number,
    purchasedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const LiveMarket = mongoose.model('LiveMarket', liveMarketSchema);
export default LiveMarket;
