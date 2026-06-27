import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Settings, Home } from "lucide-react";
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1115] text-gray-100 selection:bg-indigo-500/30`}>
        <div className="min-h-screen flex flex-col relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

          <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
                  <span className="font-bold text-white text-sm">L</span>
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">Lete</h1>
              </Link>
              
              <nav className="flex items-center gap-6 text-sm font-medium text-gray-400">
                <Link href="/" className="flex items-center gap-2 hover:text-gray-100 transition-colors duration-200">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                <Link href="/settings" className="flex items-center gap-2 hover:text-white transition-colors duration-200">
                  <div className="p-2 rounded-md hover:bg-white/10 transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full p-6 relative z-10">
            {children}
          </main>

          <footer className="border-t border-white/10 text-center p-6 text-sm text-gray-500 bg-black/20 backdrop-blur-sm z-10">
            Lete Architecture © {new Date().getFullYear()}
          </footer>
        </div>
      </body>
    </html>
  );
}
