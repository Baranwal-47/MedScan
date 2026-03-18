// ── src/components/AdminRoute.tsx ──────────────────────────────
import { Redirect } from "wouter";
import { useAuth }   from "../context/AuthContext";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated)            return <Redirect to="/login" />;
  if (user?.name !== "Utkarsh")    return <Redirect to="/" />;   // block everyone else

  return children;
}
