import redisClient from "../config/redis.js";

const CACHE_LIMIT = 100;

const CACHE_TTL = 60 * 60 * 24;


/*
 * ============================================
 * GET CACHED MESSAGES
 * ============================================
 */

export async function getCachedMessages(
  key: string,
  before?: string,
  limit = 20
) {
  /*
   * ========================================
   * INITIAL LOAD
   * ========================================
   */

  if (!before) {
    const total =
      await redisClient.zCard(key);

    if (total === 0) {
      return [];
    }

    const start = Math.max(
      0,
      total - limit
    );

    const messages =
      await redisClient.zRange(
        key,
        start,
        total - 1
      );

    return messages.map((message) =>
      JSON.parse(message)
    );
  }


  /*
   * ========================================
   * OLDER MESSAGES
   * ========================================
   */

  const beforeTimestamp =
    new Date(before).getTime();

  const olderMessages =
    await redisClient.zRangeByScore(
      key,
      "-inf",
      beforeTimestamp - 1
    );

  if (olderMessages.length === 0) {
    return [];
  }

  const start = Math.max(
    0,
    olderMessages.length - limit
  );

  const selectedMessages =
    olderMessages.slice(start);

  return selectedMessages.map(
    (message) => JSON.parse(message)
  );
}


/*
 * ============================================
 * CACHE MESSAGES
 * ============================================
 */

export async function cacheMessages(
  key: string,
  messages: any[]
) {
  if (messages.length === 0) {
    return;
  }

  const multi =
    redisClient.multi();

  for (const message of messages) {
    const score =
      new Date(
        message.createdAt
      ).getTime();

    multi.zAdd(key, {
      score,
      value: JSON.stringify(message),
    });
  }

  multi.expire(
    key,
    CACHE_TTL
  );

  await multi.exec();


  /*
   * Keep cache within limit
   */

  const count =
    await redisClient.zCard(key);

  if (count > CACHE_LIMIT) {
    await redisClient.zRemRangeByRank(
      key,
      0,
      count - CACHE_LIMIT - 1
    );
  }
}