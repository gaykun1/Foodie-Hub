
import "@/styles/globals.css";
import Header from "@/components/Header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import { useAppSelector } from "@/hooks/reduxHooks";
import SideBar from "@/components/Dashboard/SideBar";
import HeaderRestaurant from "@/components/Restaurant/HeaderRestaurant";
import Footer from "@/components/Footer";




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/auth/login");

  return (

    <Providers>
      <AuthClientUpload />
      <Header />
      <HeaderRestaurant />
      <div className="_container mt-[34px]">

        {children}
      </div>
      <Footer/>
    </Providers>

  );
}
