import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foodie Hub",
  description: "Food delivery website",
  icons: {
    icon: "/logo.ico",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#14110f" },
  ],
};

// Reads the persisted theme choice before first paint so a manual override
// never flashes the wrong theme. When nothing is stored, prefers-color-scheme
// in globals.css already handles it — no attribute needed, no flash either way.
const noFlashThemeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
