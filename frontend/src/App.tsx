import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Chat from "./pages/CommunityChat";
import Auth from "./pages/Auth";
import EditUser from "./pages/EditUser";
import AdminUsers from "./pages/AdminUsers";
import ProtectedRoute from "./utils/ProtectedRoute";
import UserList from "./pages/UserList";
import PrivateChat from "./pages/PrivateChat";

export default function App() {
  return (
    <BrowserRouter>
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
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}