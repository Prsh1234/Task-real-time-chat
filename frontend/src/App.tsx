import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import EditUser from "./pages/EditUser";
import AdminUsers from "./pages/AdminUsers";
import ProtectedRoute from "./utils/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login />}
        />
        <Route
          path="/auth"
          element={<Auth />}
        />
        <Route
          path="/register"
          element={<Register />}
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