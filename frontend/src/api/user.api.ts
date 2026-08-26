import api from "../services/api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users");

  return response.data;
};

export const deleteUser = async (
  userId: string
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/users/${userId}`
  );

  return response.data;
};