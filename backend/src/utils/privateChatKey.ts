
export default function getPrivateChatKey(
  userId1: string,
  userId2: string
) {
  return `private_chat:${[
    userId1,
    userId2,
  ]
    .sort()
    .join("_")}`;
}
