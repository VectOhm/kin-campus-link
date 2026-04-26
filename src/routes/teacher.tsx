import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/erp/components/Shell";

export const Route = createFileRoute("/teacher")({
  component: Shell,
});
