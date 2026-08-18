"use client"
import Header from "@/components/Header";
import AuthClientUpload from "@/components/AuthClientUpload";
import Footer from "@/components/Footer";
import { SideNav, adminNavItems, restaurantNavItems } from "@/components/SideNav";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { ShieldAlert } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // The only way a plain logged-in user ever becomes a "restaurant" account is
  // by submitting this page (it's what links them to a new restaurant) — so it
  // can't require the role it's the one thing that grants.
  const isOnboardingRoute = pathname === "/dashboard/create";
  const [role, setRole] = useState<string | null>(null);
  // Starts true: without it, the very first render (before checkRole
  // resolves) sees loading=false and role=null and briefly flashes
  // "Access denied" on every load.
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile/roles`, { withCredentials: true });
        setRole(res.data.role);
      } catch (err) {
        console.error(err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }
    checkRole();
  }, [])

  if (loading) {
    return <PageSpinner />;
  }

  const isManagedRole = role === "admin" || role === "restaurant";
  const isAuthorized = isOnboardingRoute ? role !== null : isManagedRole;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="_container flex-1 flex items-center justify-center py-16">
          <EmptyState
            icon={<ShieldAlert size={22} />}
            title="Access denied"
            description={role === null ? "Please log in to continue." : "You need an admin or restaurant account to view this page."}
            action={<ButtonLink href="/">Back to home</ButtonLink>}
          />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <AuthClientUpload />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="_container flex-1">
          <div className="flex gap-6 py-6">
            {isManagedRole && <SideNav items={role === "admin" ? adminNavItems : restaurantNavItems} />}
            <div className="grow min-w-0">
              <div className="border border-border rounded-lg p-6 flex flex-col bg-surface">
                {children}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
