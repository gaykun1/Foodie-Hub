
import "@/styles/globals.css";
import Header from "@/components/Header";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import SideBar from "@/components/Dashboard/SideBar";
import Footer from "@/components/Footer";
import ResponsiveSidebar from "@/components/Profile/ResponsiveSidebar";
import { cookies } from "next/headers";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {



  const token = (await cookies()).get("token")?.value;
  console.log(token);
  try {
     
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile/roles`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (data.role === "admin" || data.role === "restaurant") {
      return (

        <Providers>
          {/* auth starter component */}
          <AuthClientUpload />
          <div className="h-screen flex flex-col">
            <Header />
            <div className="_container">
              <div className="border-[1px] mt-6 lg:hidden mb-8 rounded-lg w-fit border-borderColor p-4.5">
                <ResponsiveSidebar type={data.role} />

              </div>
              <div className="flex">
                <SideBar role={data.role} />
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
