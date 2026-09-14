import type { RequestHandler } from "express";
import { GroupChat } from "../models/GroupChat.js";
import { GroupInvitation } from "../models/GroupInvitation.js";
import mongoose from "mongoose";
import type { Server } from "socket.io";
import { getSocketIO } from "../socket/socketInstance.js";


export const inviteUserToGroup: RequestHandler = async (
    req,
    res
) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;
        if (
            typeof groupId !== "string" ||
            typeof userId !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid group or user ID",
            });
        }
        const currentUserId = req.user?._id;

        const group = await GroupChat.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        // Owner check
        if (
            group.owner.toString() !==
            currentUserId?.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only the group owner can invite users",
            });
        }

        // Don't invite yourself
        if (userId === currentUserId.toString()) {
            return res.status(400).json({
                message:
                    "You cannot invite yourself",
            });
        }

        // Already a member
        const alreadyMember =
            group.members.some(
                (member) =>
                    member.toString() === userId
            );

        if (alreadyMember) {
            return res.status(400).json({
                message:
                    "User is already a group member",
            });
        }

        // Check existing pending invitation
        const existingInvitation =
            await GroupInvitation.findOne({
                group: groupId,
                invitee: userId,
                status: "PENDING",
            });

        if (existingInvitation) {
            return res.status(400).json({
                message:
                    "Invitation already pending",
            });
        }

        const invitation =
            await GroupInvitation.create({
                group: groupId,
                inviter: currentUserId,
                invitee: userId,
                status: "PENDING"
            });
        const io = getSocketIO();

        io.to(`user:${userId}`).emit(
            "group_invitation",
            {
                invitationId: invitation._id.toString(),
                groupId: groupId,
                groupName: group.groupName,

            }
        );
        return res.status(201).json({
            message: "Invitation sent",
            invitation,
        });

    } catch (error) {
        console.error(
            "Invite user error:",
            error
        );

        return res.status(500).json({
            message: "Failed to send invitation",
        });
    }
};






export const acceptGroupInvitation: RequestHandler = async (
    req, res
) => {
    try {
        const { invitationId } = req.params;
        const currentUserId = req.user?._id;

        const invitation =
            await GroupInvitation.findById(
                invitationId
            );

        if (!invitation) {
            return res.status(404).json({
                message: "Invitation not found",
            });
        }

        if (
            invitation.invitee.toString() !==
            currentUserId?.toString()
        ) {
            return res.status(403).json({
                message:
                    "You cannot accept this invitation",
            });
        }

        if (invitation.status !== "PENDING") {
            return res.status(400).json({
                message:
                    "Invitation is no longer pending",
            });
        }

        const group = await GroupChat.findById(
            invitation.group
        );

        if (!group) {
            return res.status(404).json({
                message: "Group no longer exists",
            });
        }

        // Avoid duplicate member
        const alreadyMember =
            group.members.some(
                (member) =>
                    member.toString() ===
                    currentUserId.toString()
            );

        if (!alreadyMember) {
            group.members.push(
                new mongoose.Types.ObjectId(
                    currentUserId
                )
            );

            await group.save();
        }

        invitation.status = "ACCEPTED";

        await invitation.save();

        return res.status(200).json({
            message: "Invitation accepted",
        });

    } catch (error) {
        console.error(
            "Accept invitation error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to accept invitation",
        });
    }
};



export const declineGroupInvitation: RequestHandler = async (
    req, res
) => {
    try {
        const { invitationId } = req.params;
        const currentUserId = req.user?._id;

        const invitation =
            await GroupInvitation.findById(
                invitationId
            );

        if (!invitation) {
            return res.status(404).json({
                message: "Invitation not found",
            });
        }

        if (
            invitation.invitee.toString() !==
            currentUserId?.toString()
        ) {
            return res.status(403).json({
                message:
                    "You cannot decline this invitation",
            });
        }

        if (invitation.status !== "PENDING") {
            return res.status(400).json({
                message:
                    "Invitation is no longer pending",
            });
        }

        invitation.status = "DECLINED";

        await invitation.save();

        return res.status(200).json({
            message: "Invitation declined",
        });

    } catch (error) {
        console.error(
            "Decline invitation error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to decline invitation",
        });
    }
};


export const getMyGroupInvitations: RequestHandler = async (
    req, res
) => {
    try {
        const currentUserId = req.user?._id;

        const invitations =
            await GroupInvitation.find({
                invitee: currentUserId,
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

        return res.status(200).json({
            invitations,
        });

    } catch (error) {
        console.error(
            "Get invitations error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to get invitations",
        });
    }
};