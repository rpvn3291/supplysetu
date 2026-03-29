import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  pincode: { type: String, required: true },
  question: { type: String, required: true },
  options: {
    type: Map,
    of: Number,
    required: true,
  },
  voters: [{ type: String }],
}, { timestamps: true });

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;
