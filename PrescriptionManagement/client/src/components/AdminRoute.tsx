// ── src/components/AdminRoute.tsx ──────────────────────────────
import { Redirect } from "wouter";
import { useAuth }   from "../context/AuthContext";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isAuthReady, user } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated)            return <Redirect to="/login" />;
  if (user?.role !== "admin")      return <Redirect to="/" />;

  return children;
}
