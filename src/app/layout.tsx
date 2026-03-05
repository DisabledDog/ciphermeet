import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CipherMeet - Private Video Chat",
  description: "Anonymous, private video chat. No accounts, no tracking, no data stored.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
