const ONLINE_USERS_KEY = "online_users";
import redisClient from "../config/redis.js";

export const addOnlineUser = async (userId: string) => {
    await redisClient.sAdd(ONLINE_USERS_KEY, userId);
};

export const removeOnlineUser = async (userId: string) => {
    await redisClient.sRem(ONLINE_USERS_KEY, userId);
};

export const getOnlineUsers = async () => {
    return await redisClient.sMembers(ONLINE_USERS_KEY);
};