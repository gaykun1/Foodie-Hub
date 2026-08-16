import Header from "@/components/Header";
import AuthClientUpload from "@/components/AuthClientUpload";
import Footer from "@/components/Footer";
import Ping from "@/components/Ping";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Ping />
      <AuthClientUpload />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="_container flex-1">
          {children}
        </div>
        <Footer />
      </div>
    </>
  );
}
