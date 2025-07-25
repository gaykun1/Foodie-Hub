
import "@/styles/globals.css";
import Header from "@/components/Header";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import SideBarProfile from "@/components/Profile/SideBar";
import ResponsiveSidebar from "@/components/Profile/ResponsiveSidebar";
import Footer from "@/components/Footer";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (

    <Providers>
      {/* started info component */}
      <AuthClientUpload />
      <div className="h-screen flex flex-col">
        <Header />

        <div className="_container ">
          <div className="border-[1px] lg:hidden mt-6 rounded-lg w-fit border-borderColor p-4.5">
            <ResponsiveSidebar type="profile" />

          </div>
          <div className=" relative flex py-12 gap-12 min-h-[586px]">
            <SideBarProfile />
            <div className=" grow-1">
              {children}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </Providers>

  );
}
