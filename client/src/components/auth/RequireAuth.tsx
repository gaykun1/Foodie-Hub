"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { useAppSelector } from "@/hooks/reduxHooks";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";

/**
 * Wraps the parts of the app that genuinely need an account — order history,
 * saved addresses, favourites, courier work. Anything a visitor can browse
 * (restaurants, menus, the home page) must NOT be wrapped in this.
 *
 * Rather than redirecting, it renders an explanation in place and keeps the
 * surrounding chrome, so a recruiter clicking around never loses their place.
 * The current path is passed to the login screen so they land back here.
 */
export const RequireAuth = ({
  children,
  title = "Sign in to continue",
  description = "This page is tied to your account. Sign in or create one — it takes a moment.",
  roles,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** When given, the signed-in user must additionally hold one of these roles. */
  roles?: readonly string[];
}) => {
  const { status, user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();

  if (status === "loading") return <PageSpinner />;

  if (status === "guest") {
    const next = encodeURIComponent(pathname || "/");
    return (
      <EmptyState
        icon={<LockKeyhole size={22} />}
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <ButtonLink href={`/auth/login?next=${next}`}>Sign in</ButtonLink>
            <ButtonLink href={`/auth/register?next=${next}`} variant="secondary">
              Create account
            </ButtonLink>
          </div>
        }
      />
    );
  }

  if (roles && !roles.includes(user?.role ?? "")) {
    return (
      <EmptyState
        icon={<ShieldAlert size={22} />}
        title="You don't have access to this page"
        description={`This area is for ${roles.join(" or ")} accounts.`}
        action={<ButtonLink href="/">Back to home</ButtonLink>}
      />
    );
  }

  return <>{children}</>;
};
