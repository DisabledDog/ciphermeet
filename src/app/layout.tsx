import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CipherMeet",
  description: "Video calls that leave no trace. No accounts. No tracking. No data.",
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
