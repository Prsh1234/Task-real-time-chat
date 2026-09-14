import api from "./api";

export interface GroupChat {
  _id: string;
  groupName: string;
  owner: {
            _id: string;
            name: string;
        }
}
export interface GroupMessage {
  _id: string;
  sender: string;
  senderName: string;
  message: string;
  group:string;
  createdAt: string;
  updatedAt: string;
}
export interface GroupMessagesResponse {
  source: "redis" | "mongodb";
  messages: GroupMessage[];
  hasMore: boolean;
}

export const getGroupChats = async (): Promise<GroupChat[]> => {
  const response = await api.get<GroupChat[]>("/groupChat");

  return response.data;
};


export async function getGroupById(
  groupId: string
): Promise<GroupChat> {
  const response = await api.get<GroupChat>(
    `/groupChat/${groupId}`
  );
  return response.data;
}



export async function getGroupMessages(
  groupId: string,
  limit = 20,
  before?: string
): Promise<GroupMessagesResponse> {
  const params: Record<string, string | number> = {
    limit,
  };

  if (before) {
    params.before = before;
  }

  const response =
    await api.get<GroupMessagesResponse>(
      `/groupChat/messages/${groupId}`,
      {
        params,
      }
    );

  return response.data;
}