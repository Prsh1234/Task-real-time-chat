import redisClient from "../config/redis.js";
import getPrivateChatKey from "../utils/privateChatKey.js"
const CACHE_LIMIT = 100;

const CACHE_TTL =
  60 * 60 * 24;


/*
 * ============================================
 * PRIVATE CHAT KEY
 * ============================================
 */


/*
 * ============================================
 * GET CACHED MESSAGES
 * ============================================
 *
 * before:
 *
 * undefined
 *   -> newest messages
 *
 * timestamp
 *   -> messages older than timestamp
 */
export async function getCachedPrivateMessages(
  userId: string,
  otherUserId: string,
  before?: string,
  limit = 20
) {
  const key = getPrivateChatKey(
    userId,
    otherUserId
  );

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


  /*
   * Get ALL cached messages older than
   * the current oldest message.
   */
  const olderMessages =
    await redisClient.zRangeByScore(
      key,
      "-inf",
      beforeTimestamp - 1
    );


  if (olderMessages.length === 0) {
    return [];
  }


  /*
   * We need the newest `limit` messages
   * from the older messages.
   *
   * Example:
   *
   * olderMessages:
   * 1 2 3 ... 60 61 62
   *
   * limit = 20
   *
   * Return:
   * 43 ... 62
   */

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
 * CACHE MULTIPLE MESSAGES
 * ============================================
 */

export async function cachePrivateMessages(
  userId: string,
  otherUserId: string,
  messages: any[]
) {
  if (
    messages.length === 0
  ) {
    return;
  }

  const key =
    getPrivateChatKey(
      userId,
      otherUserId
    );


  const multi =
    redisClient.multi();


  for (const message of messages) {
    const score =
      new Date(
        message.createdAt
      ).getTime();


    multi.zAdd(key, {
      score,
      value:
        JSON.stringify(message),
    });
  }


  multi.expire(
    key,
    CACHE_TTL
  );


  await multi.exec();


  /*
   * Make sure Redis does not
   * exceed CACHE_LIMIT.
   */

  const count =
    await redisClient.zCard(key);


  if (
    count > CACHE_LIMIT
  ) {
    await redisClient.zRemRangeByRank(
      key,
      0,
      count - CACHE_LIMIT - 1
    );
  }
}