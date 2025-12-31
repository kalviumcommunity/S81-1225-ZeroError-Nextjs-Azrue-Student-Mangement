import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js Routing Lesson",
  description: "Implementing Public, Protected, and Dynamic Routes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <UIProvider>
            <nav className="flex items-center gap-6 p-4 bg-white border-b shadow-sm">
              <Link href="/" className="font-bold text-blue-600 mr-4">AppLogo</Link>
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              <Link href="/users/1" className="hover:text-blue-600 transition-colors">User 1</Link>
              <Link href="/users/2" className="hover:text-blue-600 transition-colors">User 2</Link>
            </nav>
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
