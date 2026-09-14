import type mongoose from "mongoose";
import { model, Schema } from "mongoose";

export interface IGroupMessage extends Document {
  sender: mongoose.Types.ObjectId;
  group: mongoose.Types.ObjectId;
  senderName: string;
  message: string;

  createdAt: Date;
  updatedAt: Date;
}

const GroupMessageSchema = new Schema<IGroupMessage>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        group: {
            type: Schema.Types.ObjectId,
            ref: "GroupChat",
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

export const GroupMessage = model<IGroupMessage>(
    "GroupMessage",
    GroupMessageSchema
);