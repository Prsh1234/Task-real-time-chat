import type mongoose from "mongoose";
import { model, Schema } from "mongoose";

export interface IGroupChat extends Document {
    owner: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    groupName: string;
    createdAt: Date;
    updatedAt: Date;
}

const GroupChatSchema = new Schema<IGroupChat>(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,

        },
        groupName: {
            type: Schema.Types.String,
            required: true,
            trim: true,

        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
    },
    {
        timestamps: true,
    }
)

export const GroupChat = model<IGroupChat>(
    "GroupChat",
    GroupChatSchema
);