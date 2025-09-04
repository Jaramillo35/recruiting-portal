import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavWrapper } from "@/components/NavWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aptiv Recruiting Portal",
  description: "Aptiv student recruitment and interview management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="bg-aptiv-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src="/aptiv-logo.png" 
                  alt="Aptiv" 
                  className="h-8 w-auto"
                />
                <span className="text-white font-semibold text-lg">Recruiting Portal</span>
              </div>
              <div className="text-aptiv-orange text-sm font-medium">
                Home
              </div>
            </div>
          </div>
        </div>
        <NavWrapper />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
