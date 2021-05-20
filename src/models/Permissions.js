import mongoose from "mongoose";

const permissions = new mongoose.Schema({
  type: String,
  id: String,
  permissions: [String],
});

export default mongoose.model("permissions", permissions);
