// filename: models/communityModel.js
import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true,
  },
  presidentId: {
    type: String,
    required: true,
  },
});

const Community = mongoose.model('Community', communitySchema);
export default Community;
