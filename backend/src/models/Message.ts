import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IMessage>("Message", messageSchema);