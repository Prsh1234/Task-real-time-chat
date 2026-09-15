import type { Server, Socket } from "socket.io";

import { GroupInvitation } from "../models/GroupInvitation.js";
import { GroupChat } from "../models/GroupChat.js";
import mongoose from "mongoose";

interface SocketUser {
    id: string;
    name: string;
}

interface InvitationResponse {
    success: boolean;
    message: string;
    invitation?: {
        invitationId: string;
        groupId: string;
        groupName: string;
    };
}

export const initializeInvitationSocket = (
    io: Server,
    socket: Socket
) => {
    const user = socket.data.user as SocketUser;

    socket.on("invitations/get",
        async (
            callback: (response: {
                success: boolean;
                message: string;
                invitations?: unknown[];
            }) => void) => {

            try {
                const invitations =
                    await GroupInvitation.find({
                        invitee: user.id,
                        status: "PENDING",
                    })
                        .populate(
                            "group",
                            "groupName"
                        )
                        .populate(
                            "inviter",
                            "name email"
                        )
                        .sort({
                            createdAt: -1,
                        });

                callback({
                    success: true,
                    message: "Invitations fetched successfully",
                    invitations,
                });
            } catch (error) {
                console.error(error);

                callback({
                    success: false,
                    message: "Failed to fetch invitation",
                });
            }

        });
    socket.on(
        "invitation",
        async (
            {
                groupId,
                receiverId,
            }: {
                groupId: string;
                receiverId: string;
            },
            callback: (response: InvitationResponse) => void
        ) => {
            try {
                const senderId = user.id;

                /*
                 * Validate IDs
                 */
                if (
                    typeof groupId !== "string" ||
                    typeof receiverId !== "string"
                ) {
                    return callback({
                        success: false,
                        message:
                            "Invalid group or user ID",
                    });
                }

                /*
                 * Find group
                 */
                const group =
                    await GroupChat.findById(
                        groupId
                    );

                if (!group) {
                    return callback({
                        success: false,
                        message:
                            "Group not found",
                    });
                }

                /*
                 * Owner check
                 */
                if (
                    group.owner.toString() !==
                    senderId
                ) {
                    return callback({
                        success: false,
                        message:
                            "Only the group owner can invite users",
                    });
                }

                /*
                 * Don't invite yourself
                 */
                if (
                    receiverId === senderId
                ) {
                    return callback({
                        success: false,
                        message:
                            "You cannot invite yourself",
                    });
                }

                /*
                 * Already a member
                 */
                const alreadyMember =
                    group.members.some(
                        (member) =>
                            member.toString() ===
                            receiverId
                    );

                if (alreadyMember) {
                    return callback({
                        success: false,
                        message:
                            "User is already a group member",
                    });
                }

                /*
                 * Existing pending invitation
                 */
                const existingInvitation =
                    await GroupInvitation.findOne({
                        group: groupId,
                        invitee: receiverId,
                        status: "PENDING",
                    });

                if (existingInvitation) {
                    return callback({
                        success: false,
                        message:
                            "Invitation already pending",
                    });
                }

                /*
                 * Create invitation
                 */
                const invitation =
                    await GroupInvitation.create({
                        group: groupId,
                        inviter: senderId,
                        invitee: receiverId,
                        status: "PENDING",
                    });

                /*
                 * Send invitation to receiver
                 */
                io.to(`user:${receiverId}`).emit(
                    "group_invitation",
                    {
                        invitationId:
                            invitation._id.toString(),
                        groupId,
                        groupName:
                            group.groupName,
                    }
                );

                /*
                 * Response to sender
                 */
                callback({
                    success: true,
                    message:
                        "Invitation sent successfully",
                    invitation: {
                        invitationId:
                            invitation._id.toString(),
                        groupId,
                        groupName:
                            group.groupName,
                    },
                });

            } catch (error) {
                console.error(
                    "Failed to create invitation:",
                    error
                );

                callback({
                    success: false,
                    message:
                        "Failed to send invitation",
                });
            }
        }
    );





    socket.on(
        "invitation/accept",
        async (
            { invitationId },
            callback
        ) => {
            try {
                const userId = socket.data.user.id;

                const invitation =
                    await GroupInvitation.findOne({
                        _id: invitationId,
                        invitee: userId,
                        status: "PENDING",
                    });

                if (!invitation) {
                    return callback({
                        success: false,
                        message: "Invitation not found",
                    });
                }

                const group =
                    await GroupChat.findById(
                        invitation.group
                    );

                if (!group) {
                    return callback({
                        success: false,
                        message: "Group not found",
                    });
                }

                const alreadyMember =
                    group.members.some(
                        (member) =>
                            member.toString() === userId
                    );

                if (!alreadyMember) {
                    group.members.push(
                        new mongoose.Types.ObjectId(userId)
                    );

                    await group.save();
                }

                invitation.status = "ACCEPTED";
                await invitation.save();

                const populatedGroup =
                    await GroupChat.findById(group._id)
                        .select("owner groupName")
                        .populate("owner", "name");

                callback({
                    success: true,
                    message: "Joined group successfully",
                    group: populatedGroup,
                });

            } catch (error) {
                console.error(error);

                callback({
                    success: false,
                    message: "Failed to join group",
                });
            }
        }
    );


    socket.on(
        "invitation/decline",
        async (
            { invitationId },
            callback
        ) => {
            try {
                const userId = user.id;

                const invitation =
                    await GroupInvitation.findOne({
                        _id: invitationId,
                        invitee: userId,
                        status: "PENDING",
                    });

                if (!invitation) {
                    return callback({
                        success: false,
                        message:
                            "Invitation not found or already processed",
                    });
                }

                invitation.status = "DECLINED";

                await invitation.save();

                callback({
                    success: true,
                    message:
                        "Invitation declined",
                });

            } catch (error) {
                console.error(
                    "Decline invitation error:",
                    error
                );

                callback({
                    success: false,
                    message:
                        "Failed to decline invitation",
                });
            }
        }
    );
};