import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/user-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stackit – Minimal Q&A Forum",
  description: "Ask and answer questions in a collaborative space.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          backgroundColor: "#f9f9f9", // Light background for readability
          color: "#000", // Text will be black
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
