import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import { Settings, Sparkles } from "lucide-react";
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
      <body className={`${dmSans.variable} font-sans antialiased text-ink selection:bg-brand-blue/20`}>
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 border-b border-hairline-soft bg-canvas/92 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-3" aria-label="Lete home">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Sparkles size={17} strokeWidth={2.2} />
                  </span>
                  <span className="text-xl font-bold tracking-tight text-ink">Lete</span>
                </Link>

                <nav className="hidden items-center gap-1 md:flex">
                  <Link
                    href="/"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-steel transition-colors hover:bg-surface hover:text-ink"
                  >
                    Home
                  </Link>
                  <Link
                    href="/workspaces"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-steel transition-colors hover:bg-surface hover:text-ink"
                  >
                    Workspaces
                  </Link>
                  <Link
                    href="/settings"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-steel transition-colors hover:bg-surface hover:text-ink"
                  >
                    Settings
                  </Link>
                </nav>
              </div>

              <Link
                href="/settings"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-charcoal"
              >
                <Settings size={16} />
                Configure
              </Link>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
