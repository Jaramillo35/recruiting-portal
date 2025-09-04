import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavWrapper } from "@/components/NavWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Recruiting Portal",
  description: "Student recruitment and interview management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <NavWrapper />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
