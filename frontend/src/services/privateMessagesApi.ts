import api from "./api";

export interface PrivateMessage {
  _id: string;
  sender: string;
  receiver: string;
  senderName: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateMessagesResponse {
  source: "redis" | "mongodb";
  messages: PrivateMessage[];
  hasMore: boolean;
}

export async function getPrivateMessages(
  userId: string,
  limit = 20,
  before?: string
): Promise<PrivateMessagesResponse> {
  const params: Record<string, string | number> = {
    limit,
  };

  if (before) {
    params.before = before;
  }

  const response =
    await api.get<PrivateMessagesResponse>(
      `/private/messages/${userId}`,
      {
        params,
      }
    );

  return response.data;
}