import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loop",
  description: "Loop on Stellar Testnet with multi-wallet support and XLM send flow"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
