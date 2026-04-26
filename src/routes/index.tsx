import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/erp/store/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { currentUser } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (currentUser) navigate({ to: `/${currentUser.role}` as "/admin" });
    else navigate({ to: "/login" });
  }, [currentUser, navigate]);
  return null;
}
