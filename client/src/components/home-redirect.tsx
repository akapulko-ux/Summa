import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomeRedirect() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      // Если пользователь - клиент, перенаправляем на страницу "Маркет"
      if (user.role === "client") {
        navigate("/services");
      } else {
        // Если администратор, перенаправляем на дашборд
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  return null; // Не отображаем ничего, только перенаправляем
}