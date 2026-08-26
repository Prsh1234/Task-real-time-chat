# Real-Time Chat Application

A full-stack real-time chat application built as part of the Palm Mind AI technical assessment.

The application provides user authentication and authorization, real-time messaging using Socket.IO, persistent chat history using MongoDB, and live chat statistics.

## Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication
- bcrypt

### Frontend
- React
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Axios
- React Router
- Lucide React

## Features

### Authentication & Authorization
- User registration
- User login
- JWT-based authentication
- Protected routes
- Role-based authorization
- Admin access

### Real-Time Chat
- Send and receive messages in real time
- Socket.IO integration
- User join/leave events
- Typing indicator
- Live connection status
- Messages persisted in MongoDB
- Chat history loading
- Load older messages when scrolling upward

### Chat Statistics
- Total registered users
- Total messages
- Real-time statistics updates when a new message is sent

### Frontend
- Responsive chat interface
- Auto-scroll to latest messages
- New-message scroll indicator
- Infinite/paginated loading of older messages
- User profile and logout actions
- Admin navigation

---

# Project Structure

```text
real-time-chat/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── socket/
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md