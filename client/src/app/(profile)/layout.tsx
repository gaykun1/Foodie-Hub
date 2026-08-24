import Header from "@/components/Header";
import AuthClientUpload from "@/components/AuthClientUpload";
import Footer from "@/components/Footer";
import { SideNav, profileNavItems } from "@/components/SideNav";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AuthClientUpload />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="_container flex-1">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 py-8">
            <SideNav items={profileNavItems} />
            <div className="grow min-w-0">
              {children}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
