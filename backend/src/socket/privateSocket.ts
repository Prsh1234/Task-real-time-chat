import { Server, Socket } from "socket.io";

import PrivateMessage from "../models/PrivateMessage.js";

import {
    cacheMessages,
} from "../services/messageCache.js";
import getPrivateChatKey from "../utils/privateChatKey.js";

interface SocketUser {
    id: string;
    name: string;
}




export const initializePrivateSocket = (
    io: Server,
    socket: Socket
) => {
    const user = socket.data.user as SocketUser;

    /*
     * ==========================================
     * JOIN PRIVATE CHAT
     * ==========================================
     */

    socket.on(
        "join_private_chat",
        (otherUserId: string) => {
            const currentUserId =
                user.id;

            const roomId =
                getPrivateChatKey(
                    currentUserId,
                    otherUserId
                );

            socket.join(roomId);

            console.log(
                `${user.name} joined private room: ${roomId}`
            );
        }
    );


    /*
     * ==========================================
     * PRIVATE MESSAGE
     * ==========================================
     */

    socket.on(
        "private_message",
        async (data: {
            receiverId: string;
            message: string;
        }) => {
            try {
                const messageText =
                    data.message.trim();

                if (!messageText) {
                    return;
                }

                const senderId =
                    user.id;

                const receiverId =
                    data.receiverId;


                /*
                 * ------------------------------------
                 * 1. SAVE TO MONGODB
                 * ------------------------------------
                 */

                const privateMessage =
                    await PrivateMessage.create({
                        sender: senderId,
                        receiver: receiverId,
                        senderName: user.name,
                        message: messageText,
                    });


                /*
                 * ------------------------------------
                 * 2. FORMAT MESSAGE
                 * ------------------------------------
                 */

                const formattedMessage = {
                    _id:
                        privateMessage._id.toString(),

                    sender:
                        privateMessage.sender.toString(),

                    receiver:
                        privateMessage.receiver.toString(),

                    senderName:
                        privateMessage.senderName,

                    message:
                        privateMessage.message,

                    createdAt:
                        privateMessage.createdAt,

                    updatedAt:
                        privateMessage.updatedAt,
                };



                /*
                 * ------------------------------------
                 * 3. GET PRIVATE ROOM
                 * ------------------------------------
                 */

                const roomId =
                    getPrivateChatKey(
                        senderId,
                        receiverId
                    );

                /*
                 * ------------------------------------
                 * 4. SAVE TO REDIS CACHE
                 * ------------------------------------
                 */

                await cacheMessages(
                    roomId,
                    [formattedMessage]
                );




                /*
                 * ------------------------------------
                 * 5. SEND TO BOTH USERS
                 * ------------------------------------
                 */

                io.to(roomId).emit(
                    "private_message",
                    formattedMessage
                );

            } catch (error) {
                console.error(
                    "Private message error:",
                    error
                );

                socket.emit(
                    "private_message_error",
                    {
                        message:
                            "Failed to send private message",
                    }
                );
            }
        }
    );


    /*
     * ==========================================
     * LEAVE PRIVATE CHAT
     * ==========================================
     */

    socket.on(
        "leave_private_chat",
        (otherUserId: string) => {
            const roomId =
                getPrivateChatKey(
                    user.id,
                    otherUserId
                );

            socket.leave(roomId);

            console.log(
                `${user.name} left private room: ${roomId}`
            );
        }
    );


    /*
     * ==========================================
     * PRIVATE TYPING
     * ==========================================
     */

    socket.on(
        "private_typing",
        ({
            receiverId,
        }: {
            receiverId: string;
        }) => {
            const roomId =
                getPrivateChatKey(
                    user.id,
                    receiverId
                );

            socket
                .to(roomId)
                .emit(
                    "private_typing",
                    {
                        id: user.id,
                        name: user.name,
                    }
                );
        }
    );


    /*
     * ==========================================
     * PRIVATE STOP TYPING
     * ==========================================
     */

    socket.on(
        "private_stop_typing",
        ({
            receiverId,
        }: {
            receiverId: string;
        }) => {
            const roomId =
                getPrivateChatKey(
                    user.id,
                    receiverId
                );

            socket
                .to(roomId)
                .emit(
                    "private_stop_typing",
                    {
                        id: user.id,
                    }
                );
        }
    );
};