import type { Metadata } from "next";
import { CircleProvider } from "@/lib/circle-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loop - Stellar Rotating Savings Circle",
  description: "Trustless ROSCA platform built on Stellar Soroban smart contracts"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#03000d]">
        <CircleProvider>
          {children}
        </CircleProvider>
      </body>
    </html>
  );
}
