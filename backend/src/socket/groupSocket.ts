import { Server, Socket } from "socket.io";


import {
  cacheMessages,
} from "../services/messageCache.js";
import { GroupMessage } from "../models/GroupChatMessages.js";
import getGroupChatKey from "../utils/groupChatKey.js";
import { GroupChat } from "../models/GroupChat.js";

interface SocketUser {
  id: string;
  name: string;
}



export const initializeGroupSocket = (
  io: Server,
  socket: Socket
) => {
  const user = socket.data.user as SocketUser;

  /*
   * ==========================================
   * JOIN Group CHAT
   * ==========================================
   */

socket.on("join_group_chat", async (groupId: string) => {
    try {
        const user = socket.data.user;

        if (!user?.id) {
            return;
        }

        const group = await GroupChat.findById(groupId)
            .select("members");

        if (!group) {
            socket.emit("group_error", {
                message: "Group not found",
            });
            return;
        }

        const isMember = group.members.some(
            (member) =>
                member.toString() === user.id
        );

        if (!isMember) {
            socket.emit("group_error", {
                message: "You are not a member of this group",
            });

            return;
        }

        socket.join(`group:${groupId}`);

    } catch (error) {
        console.error("Join group error:", error);

        socket.emit("group_error", {
            message: "Failed to join group",
        });
    }
});


  /*
   * ==========================================
   * GROUP MESSAGE
   * ==========================================
   */

  socket.on(
    "group_message",
    async (data: {
      groupId: string;
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

        const groupId =
          data.groupId;


        /*
         * ------------------------------------
         * 1. SAVE TO MONGODB
         * ------------------------------------
         */

        const groupMessage =
          await GroupMessage.create({
            sender: senderId,
            group: groupId,
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
            groupMessage._id.toString(),

          sender:
            groupMessage.sender.toString(),
          group: groupMessage.group.toString(),

          senderName:
            groupMessage.senderName,

          message:
            groupMessage.message,

          createdAt:
            groupMessage.createdAt,

          updatedAt:
            groupMessage.updatedAt,

        };


        /*
         * ------------------------------------
         * 3. SAVE TO REDIS CACHE
         * ------------------------------------
         */
        const key = getGroupChatKey(groupId);
        await cacheMessages(
          key,
          [formattedMessage]
        );




        /*
         * ------------------------------------
         * 4. SEND TO ALL USERS IN GROUP
         * ------------------------------------
         */

        io.to(key).emit(
          "group_message",
          formattedMessage
        );

      } catch (error) {
        console.error(
          "Group message error:",
          error
        );

        socket.emit(
          "group_message_error",
          {
            message:
              "Failed to send group message",
          }
        );
      }
    }
  );


  /*
   * ==========================================
   * LEAVE GROUP CHAT
   * ==========================================
   */

  socket.on(
    "leave_group_chat",
    (groupId: string) => {
      const group =
        getGroupChatKey(
          groupId
        );
      socket.leave(group);

      console.log(
        `${user.name} left group: ${group}`
      );
    }
  );


  /*
   * ==========================================
   * GROUP TYPING
   * ==========================================
   */

  socket.on(
    "group_typing",
    ({ groupId }: { groupId: string; }) => {
      const group =
        getGroupChatKey(
          groupId
        );
      socket
        .to(group)
        .emit(
          "group_typing",
          {
            id: user.id,
            name: user.name,
          }
        );
    }
  );


  /*
   * ==========================================
   * GROUP STOP TYPING
   * ==========================================
   */

  socket.on(
    "group_stop_typing",
    ({
      groupId,
    }: {
      groupId: string;
    }) => {
      const group =
        getGroupChatKey(
          groupId
        );

      socket
        .to(group)
        .emit(
          "group_stop_typing",
          {
            id: user.id,
          }
        );
    }
  );
};