
import "@/styles/globals.css";
import Header from "@/components/Header";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import HeaderRestaurant from "@/components/Restaurant/HeaderRestaurant";
import Footer from "@/components/Footer";
import { redirect } from "next/navigation";
import { checkAuth } from "@/utils/auth";




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const user = await checkAuth();

  if (!user) {
    redirect("/auth/login");
  }
  return (

    <Providers>
      {/* starter info component  */}

      <AuthClientUpload />
      <div className="h-screen flex flex-col">
        <Header />
        <HeaderRestaurant />
        <div className="_container mt-[34px]">

          {children}
        </div>
        <Footer />
      </div>
    </Providers>

  );
}
