import {
  Routes,
  Route,
  useNavigate
} from "react-router-dom";

import Chat from "./pages/CommunityChat";
import Auth from "./pages/Auth";
import EditUser from "./pages/EditUser";
import AdminUsers from "./pages/AdminUsers";
import ProtectedRoute from "./utils/ProtectedRoute";
import UserList from "./pages/UserList";
import PrivateChat from "./pages/PrivateChat";
import GroupList from "./pages/GroupList";
import GroupChat from "./pages/GroupChat";
import { useEffect } from "react";
import { connectSocket, disconnectSocket, socket } from "./services/socket";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if(!token){
      navigate("/");
    }

    if (token) {
      connectSocket(token);
    }

    return () => {
      disconnectSocket();
    };
  }, []);
  const navigate = useNavigate();
  // Listen for invitations
  useEffect(() => {
    const handleGroupInvitation = (invitation: {
      invitationId: string;
      groupId: string;
      groupName: string;
    }) => {
      toast(
        <div
          onClick={() => {
            navigate("/groupList");
          }}
          className="cursor-pointer"
        >
          <p className="font-semibold">
            New Group Invitation
          </p>

          <p>
            You have been invited to{" "}
            {invitation.groupName}
          </p>

          <p className="mt-1 text-sm">
            Click to view invitation
          </p>
        </div>,
        {
          autoClose: 5000,
          position: "top-right",
        }
      );
      window.dispatchEvent(
        new Event("group-invitation-received")
      );
    };

    socket.on(
      "group_invitation",
      handleGroupInvitation
    );

    return () => {
      socket.off(
        "group_invitation",
        handleGroupInvitation
      );
    };
  }, [navigate]);
  return (
    <>
      <ToastContainer />
      <Routes>

        <Route
          path="/"
          element={<Auth />}
        />

        <Route
          path="/chat"
          element={<Chat />}
        />
        <Route
          path="/profile"
          element={<EditUser />}
        />

        <Route
          path="/home"
          element={<UserList />}
        />

        <Route
          path="/chat/:userId"
          element={<PrivateChat />}
        />
        <Route
          path="/groupList"
          element={<GroupList />}
        />
        <Route
          path="/groupChat/:groupId"
          element={<GroupChat />}
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />

      </Routes>
    </>


  );
}