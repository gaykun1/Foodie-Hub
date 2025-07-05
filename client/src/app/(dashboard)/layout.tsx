
import "@/styles/globals.css";
import Header from "@/components/Header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import { useAppSelector } from "@/hooks/reduxHooks";
import axios from "axios";
import SideBar from "@/components/Dashboard/SideBar";




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/auth/login");

  try {

    const res = await axios.get("http://localhost:5200/api/auth/check-admin", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.data.role == "admin") {
      return (
     
            <Providers>
              <AuthClientUpload />
              <Header />

              <div className="_container flex">
                <SideBar />
        <div className="p-8 grow-1">
           <div className="border-borderColor border-[1px] rounded-lg p-6 flex flex-col overflow-hidden overflow-y-auto max-h-[900px]">
                {children}
                </div>
                </div>
              </div>
            </Providers>
         
      );
    } else {
      return (
        <div className="">
            <h1>Error</h1>
            <p>Access denied</p>
        </div>
      )
    }


  } catch (err) {
    return (
      <div className="">
            <h1>Error</h1>
            <p>Access denied</p>
        </div>
    )
  }

}
