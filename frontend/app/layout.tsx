import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lete",
  description: "Lete Adaptive Context Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-white p-4">
            <h1 className="text-xl font-bold">Lete</h1>
          </header>
          <main className="flex-1 max-w-5xl mx-auto w-full p-4">
            {children}
          </main>
          <footer className="border-t text-center p-4 text-sm text-gray-500">
            Lete
          </footer>
        </div>
      </body>
    </html>
  );
}
