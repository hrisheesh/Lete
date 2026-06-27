import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <body className={`${dmSans.variable} font-sans antialiased bg-canvas text-ink selection:bg-brand-blue/20`}>
        <div className="min-h-screen flex flex-col">
          {/* Top Navigation */}
          <header className="bg-canvas border-b border-hairline-soft sticky top-0 z-50">
            <div className="max-w-[1280px] mx-auto px-8 h-[64px] flex items-center justify-between">
              {/* Left: Brand & Nav */}
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-ink">Lete</h1>
                </Link>
                
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="/" className="text-[14px] font-medium text-steel">
                    Home
                  </Link>
                  <Link href="/settings" className="text-[14px] font-medium text-ink">
                    Settings
                  </Link>
                </nav>
              </div>

              {/* Right: CTAs */}
              <div className="flex items-center gap-4">
                <Link 
                  href="/settings"
                  className="bg-primary text-on-primary text-[14px] font-semibold py-[11px] px-[24px] rounded-full"
                >
                  Configure
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 w-full pb-24">
            {children}
          </main>

          {/* Footer Region */}
          <footer className="bg-primary text-on-primary px-8 py-[64px]">
            <div className="max-w-[1280px] mx-auto text-[14px] text-gray-500">
              Lete Adaptive Context Engine © {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
