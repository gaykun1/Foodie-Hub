
import "@/styles/globals.css";
import Header from "@/components/Header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import axios from "axios";
import SideBar from "@/components/Dashboard/SideBar";
import Footer from "@/components/Footer";




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/auth/login");

  try {

    const res = await axios.get("http://localhost:5200/api/auth/check-role", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.data.role === "admin" || res.data.role === "restaurant") {
      return (

        <Providers>
          <AuthClientUpload />
          <Header />

          <div className="_container flex">
            <SideBar role={res.data.role} />
            <div className="p-8 grow-1">
              <div className="border-borderColor border-[1px] rounded-lg p-6 flex flex-col overflow-hidden ">
                {children}
              </div>
            </div>
          </div>
          <Footer />
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
    let error = "";
    return (
      <div className="">
        <h1>Error</h1>

        <p>Access denied</p>
      </div>
    )
  }

}
