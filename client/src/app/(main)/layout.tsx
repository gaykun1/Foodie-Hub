
import "@/styles/globals.css";
import Header from "@/components/Header";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import SideBarProfile from "@/components/Profile/SideBar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await (await cookies()).get("token")?.value;
  if (!token) redirect("/auth/login");
  return (

    <Providers>
      <AuthClientUpload />
      <Header />
      <div className="_container ">
        <div className="">
          {children}
        </div>
      </div>
    </Providers>

  );
}
