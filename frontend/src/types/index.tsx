export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface Message {
  _id: string;
  sender: string;
  senderName: string;
  message: string;
  createdAt: string;
  type?: "message" | "join" | "leave";
}

export interface ChatStats {
  totalUsers: number;
  totalMessages: number;
}

export interface ChatEvent {
  id: string;
  type: "join" | "leave";
  userName: string;
}