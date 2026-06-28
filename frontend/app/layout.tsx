import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import { Home, Layers3, Settings, Sparkles } from "lucide-react";
import "./globals.css";
import "katex/dist/katex.min.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lete",
  description: "Lete Adaptive Context Engine",
};

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workspaces", label: "Workspaces", icon: Layers3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased text-ink`}>
        <div className="relative h-svh overflow-hidden">
          <header className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-5">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
              <Link
                href="/"
                className="pointer-events-auto flex h-12 min-w-0 items-center gap-2 rounded-full border border-black/8 bg-white/82 px-2.5 pr-4 shadow-[0_18px_60px_rgba(17,17,17,0.12)] backdrop-blur-2xl transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white"
                aria-label="Lete home"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <Sparkles size={16} />
                </span>
                <span className="truncate text-sm font-bold tracking-tight text-ink">Lete</span>
              </Link>

              <nav
                className="pointer-events-auto hidden h-12 items-center gap-1 rounded-full border border-black/8 bg-primary/90 p-1 shadow-[0_18px_60px_rgba(17,17,17,0.16)] backdrop-blur-2xl md:flex"
                aria-label="Primary navigation"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold text-white/62 transition duration-200 ease-out hover:bg-white hover:text-ink"
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          {children}

          <nav
            className="fixed inset-x-3 bottom-3 z-50 grid h-14 grid-cols-3 rounded-full border border-black/8 bg-primary/92 p-1 shadow-[0_18px_60px_rgba(17,17,17,0.22)] backdrop-blur-2xl md:hidden"
            aria-label="Mobile navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center rounded-full text-white/62 transition duration-200 ease-out hover:bg-white hover:text-ink"
                >
                  <Icon size={18} />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </body>
    </html>
  );
}
