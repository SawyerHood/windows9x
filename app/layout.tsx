import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "98.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Windows 9X",
  description: "The future of yesterday",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
