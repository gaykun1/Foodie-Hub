import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "./providers/Providers";
export const metadata: Metadata = {
  title: "Foodie Hub",
  description: "Food delivery website",
  icons: {
    icon: '/logo.ico'
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body

      >
        <Providers>
          {children}

        </Providers>
      </body>
    </html>
  );
}
