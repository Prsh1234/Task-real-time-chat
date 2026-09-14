import mongoose from "mongoose";

const groupInvitationSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GroupChat",
            required: true,
        },

        inviter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        invitee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "DECLINED",
            ],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

groupInvitationSchema.index(
    {
        group: 1,
        invitee: 1,
        status: 1,
    }
);

export const GroupInvitation =
    mongoose.model(
        "GroupInvitation",
        groupInvitationSchema
    );