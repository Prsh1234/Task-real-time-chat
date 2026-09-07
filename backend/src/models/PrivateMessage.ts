import mongoose, { Document, Schema } from "mongoose";

export interface IPrivateMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;

  senderName: string;

  message: string;

  createdAt: Date;
  updatedAt: Date;
}

const privateMessageSchema = new Schema<IPrivateMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderName: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


privateMessageSchema.index({
  sender: 1,
  receiver: 1,
  createdAt: -1,
});

privateMessageSchema.index({
  receiver: 1,
  sender: 1,
  createdAt: -1,
});

export default mongoose.model<IPrivateMessage>(
  "PrivateMessage",
  privateMessageSchema
);