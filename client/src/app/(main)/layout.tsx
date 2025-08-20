
import "@/styles/globals.css";
import Header from "@/components/Header";
import Providers from "../providers/Providers";
import AuthClientUpload from "@/components/AuthClientUpload";
import Footer from "@/components/Footer";
import Ping from "@/components/Ping";





export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ping`);

  return (

    <Providers>
      {/* starter info component  */}
      <Ping/>
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
