import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <EmptyState
        icon={<Compass size={22} />}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={<ButtonLink href="/">Back to home</ButtonLink>}
      />
    </div>
  );
}
