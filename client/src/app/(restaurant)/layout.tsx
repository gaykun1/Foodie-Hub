import Header from "@/components/Header";
import AuthClientUpload from "@/components/AuthClientUpload";
import HeaderRestaurant from "@/components/Restaurant/HeaderRestaurant";
import Footer from "@/components/Footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <>
      <AuthClientUpload />
      <div className="min-h-screen flex flex-col">
        <Header />
        <HeaderRestaurant />
        <div className="_container flex-1 mt-8">
          {children}
        </div>
        <Footer />
      </div>
    </>
  );
}
