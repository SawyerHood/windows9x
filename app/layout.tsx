import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "98.css";
import "./globals.css";
import { CSPostHogProvider } from "@/lib/CSPosthogProvider";
import { APIProvider } from "@/lib/api/APIProvider";

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
      <CSPostHogProvider>
        <APIProvider>
          <body className={inter.className}>{children}</body>
        </APIProvider>
      </CSPostHogProvider>
    </html>
  );
}
