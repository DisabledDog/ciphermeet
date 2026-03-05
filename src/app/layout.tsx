import type { Metadata } from "next";
import "./globals.css";
import { PageTracker } from "@/components/PageTracker";

export const metadata: Metadata = {
  title: "CipherMeet — Video Calls That Leave No Trace",
  description: "Privacy-first video calling. No accounts, no data stored, no trace. End-to-end encrypted, anonymous, and ephemeral.",
  keywords: ["video call", "encrypted", "private", "anonymous", "no account", "end-to-end encryption", "ephemeral"],
  authors: [{ name: "SortedTech" }],
  openGraph: {
    title: "CipherMeet — Video Calls That Leave No Trace",
    description: "Privacy-first video calling. No accounts, no data stored, no trace. End-to-end encrypted, anonymous, and ephemeral.",
    url: "https://ciphermeet.io",
    siteName: "CipherMeet",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CipherMeet — Video Calls That Leave No Trace",
    description: "Privacy-first video calling. No accounts, no data stored, no trace. End-to-end encrypted, anonymous, and ephemeral.",
  },
  metadataBase: new URL("https://ciphermeet.io"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PageTracker />
        {children}
      </body>
    </html>
  );
}
