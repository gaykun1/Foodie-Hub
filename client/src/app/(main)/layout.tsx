
import "@/styles/globals.css";
import Header from "@/components/Header";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // auth middleware
  const token = await (await cookies()).get("token")?.value;
  if (!token) redirect("/auth/login");
  return (

    <Providers>
      {/* starter info component  */}
      <AuthClientUpload />
      <div className="h-screen flex flex-col">
        <Header />
        <div className="_container ">
          <div className="flex-1">
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </Providers>

  );
}
