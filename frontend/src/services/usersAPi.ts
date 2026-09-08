// services/usersApi.ts (or wherever similar API helpers live)
import api from "./api";

export interface UserSummary {
  _id: string;
  name: string;
}

export async function getUserById(
  userId: string
): Promise<UserSummary> {
  const response = await api.get<UserSummary>(
    `/users/${userId}`
  );
  return response.data;
}