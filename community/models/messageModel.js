// filename: models/messageModel.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      index: true, // Add index for faster queries
    },
    userId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
