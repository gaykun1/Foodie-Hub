
import "@/styles/globals.css";
import Header from "@/components/Header";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import SideBarProfile from "@/components/Profile/SideBar";




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

        <Providers>
          <AuthClientUpload />
          <Header />
          <div className="_container flex py-12 gap-12 min-h-[586px]">
            <SideBarProfile />
            <div className="grow-1">
            {children}
            </div>
          </div>
        </Providers>
     
  );
}
