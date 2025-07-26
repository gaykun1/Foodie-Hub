
"use client"
import "@/styles/globals.css";
import Header from "@/components/Header";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import SideBar from "@/components/Dashboard/SideBar";
import Footer from "@/components/Footer";
import ResponsiveSidebar from "@/components/Profile/ResponsiveSidebar";
import axios from "axios";
import { useEffect, useState } from "react";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [role, setRole] = useState<string | null>(null);
  const checkRole = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile/roles`, { withCredentials: true });
      setRole(res.data.role);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    checkRole();
  }, [])
  try {

    if (role === "admin" || role === "restaurant") {
      return (

        <Providers>
          {/* auth starter component */}
          <AuthClientUpload />
          <div className="h-screen flex flex-col">
            <Header />
            <div className="_container">
              <div className="border-[1px] mt-6 lg:hidden mb-8 rounded-lg w-fit border-borderColor p-4.5">
                <ResponsiveSidebar type={role} />

              </div>
              <div className="flex">
                <SideBar role={role} />
                <div className="md:p-8 grow-1">
                  <div className="border-borderColor border-[1px] rounded-lg p-6 flex flex-col  ">
                    {children}
                  </div>
                </div>
              </div>
            </div>
            <Footer />
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
    console.log(err);
    return (
      <div className="">
        <h1>Error </h1>

        <p>Access denied</p>
      </div>
    )
  }

}
