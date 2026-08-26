import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRole: string;
  children: React.ReactNode;
}

const ProtectedRoute = ({
  allowedRole,
  children,
}: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );  
  const role=user?.role;
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;