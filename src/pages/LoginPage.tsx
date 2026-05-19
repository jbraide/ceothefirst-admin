import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/features/auth/components/LoginForm";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/Spinner";

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show a centered spinner while redirecting — prevents a white flash
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size={32} />
      </div>
    );
  }

  return <LoginForm />;
}
