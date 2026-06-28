import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import { Home, Layers3, Settings, Sparkles } from "lucide-react";
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
        <div className="min-h-screen pb-20 md:pb-0">
          <header className="sticky top-0 z-50 border-b border-black/5 bg-[#fbfaf7]/88 backdrop-blur-2xl">
            <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Lete home">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_14px_36px_rgba(17,17,17,0.2)]">
                  <Sparkles size={18} strokeWidth={2.4} />
                </span>
                <span className="truncate text-xl font-bold tracking-tight text-ink">Lete</span>
              </Link>

              <nav className="hidden items-center gap-1 rounded-full border border-black/5 bg-white/80 p-1 shadow-[0_14px_40px_rgba(17,17,17,0.06)] md:flex">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-steel transition duration-200 ease-out hover:bg-primary hover:text-on-primary"
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          <main>{children}</main>

          <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-full border border-black/10 bg-white/90 p-1 shadow-[0_18px_50px_rgba(17,17,17,0.16)] backdrop-blur-2xl md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-full text-xs font-bold text-steel transition duration-200 ease-out hover:bg-primary hover:text-on-primary"
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </body>
    </html>
  );
}
