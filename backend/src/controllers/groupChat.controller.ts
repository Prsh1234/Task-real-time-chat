import type { RequestHandler } from "express";
import { GroupChat } from "../models/GroupChat.js";
import { cacheMessages, getCachedMessages } from "../services/messageCache.js";
import { GroupMessage } from "../models/GroupChatMessages.js";
import getGroupChatKey from "../utils/groupChatKey.js";
import User from "../models/User.js";


interface GroupChatParams {
    groupId: string;
}
export const createGroupChat: RequestHandler = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const currentUserId = req.user._id.toString();
        const { groupName } = req.body;

        const groupChat = await GroupChat.create({
            groupName: groupName,
            owner: currentUserId,
            members: [currentUserId],
        });

        return res.status(201).json({
            message: "Group created successfully",
            group: groupChat,
        });
    } catch (error) {
        console.error(
            "Error creating group chat:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create group.",
        });
    }
}


export const getGroupList: RequestHandler = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const currentUserId = req.user._id.toString();
        const groupChats = await GroupChat.find({
            members: currentUserId,
        })
            .select("owner groupName")
            .populate("owner", "name");

        return res.status(200).json(
            groupChats
        );
    } catch (error) {
        console.error(
            "Error fetching group chats:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch groups.",
        });
    }
}

export const getGroup: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    const group = await GroupChat.findById(id)
        .select("groupName owner members")
        .populate("owner", "name");

    if (!group) {
        return res.status(404).json({
            message: "Group not found",
        });
    }

    const isMember = group.members.some(
        (member) =>
            member.toString() ===
            currentUserId.toString()
    );

    if (!isMember) {
        return res.status(403).json({
            message: "You are not a member of this group",
        });
    }

    return res.status(200).json(group);
}

export const searchUsersForGroup: RequestHandler = async (
    req, res
) => {
    try {
        const { groupId } = req.params;
        const { q } = req.query;

        const currentUserId = req.user?._id;

        if (!q || typeof q !== "string") {
            return res.status(400).json({
                message: "Search query is required",
            });
        }

        const group = await GroupChat.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        // Only owner can search users for invitations
        if (
            group.owner.toString() !==
            currentUserId?.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only the group owner can invite users",
            });
        }

        const users = await User.find({
            $or: [
                {
                    name: {
                        $regex: q,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: q,
                        $options: "i",
                    },
                },
            ],

            _id: {
                $nin: [
                    ...group.members,
                    currentUserId,
                ],
            },
        })
            .select("_id name email")
            .limit(10);

        return res.status(200).json({
            users,
        });

    } catch (error) {
        console.error(
            "Search group users error:",
            error
        );

        return res.status(500).json({
            message: "Failed to search users",
        });
    }
};












export const getGroupMessages: RequestHandler<GroupChatParams> = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const currentUserId =
            req.user._id.toString();

        const groupId = req.params.groupId;
        const group = await GroupChat.findById(groupId)
            .select("members");

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        const isMember = group.members.some(
            (member) =>
                member.toString() === currentUserId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group",
            });
        }
        const limit = Math.min(
            Number(req.query.limit) || 20,
            50
        );

        const before =
            typeof req.query.before === "string"
                ? req.query.before
                : undefined;
        const key =
            getGroupChatKey(groupId);
        const cachedMessages =
            await getCachedMessages(
                key,
                before,
                limit
            );

        if (
            cachedMessages.length === limit
        ) {
            console.log(`[messages] source=redis user=${currentUserId} groupId=${groupId} count=${cachedMessages.length}`);

            return res.json({
                source: "redis",
                messages: cachedMessages,
                hasMore: true,
            });
        }

        const query = {
            group: groupId,

            ...(before
                ? {
                    createdAt: {
                        $lt: new Date(before),
                    },
                }
                : {}),
        };

        const mongoMessages =
            await GroupMessage.find(query)
                .sort({
                    createdAt: -1,
                })
                .limit(limit + 1)
                .lean();

        const hasMore =
            mongoMessages.length > limit;

        if (hasMore) {
            mongoMessages.pop();
        }

        const messages =
            mongoMessages.reverse();

        await cacheMessages(
            key,
            messages
        );
        console.log(`[messages] source=mongodb user=${currentUserId} group=${groupId} count=${messages.length}`);

        return res.json({
            source: "mongodb",
            messages,
            hasMore,
        });
    } catch (error) {
        console.error(
            "Get private messages error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve private messages",
        });
    }
};
