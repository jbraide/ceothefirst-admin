import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/features/auth/components/LoginForm";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Don't render the form while redirecting — prevents a flash
  if (isAuthenticated) {
    return null;
  }

  return <LoginForm />;
}
