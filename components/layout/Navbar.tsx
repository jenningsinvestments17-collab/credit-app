import Link from "next/link";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/results", label: "Results" },
  { href: "/book", label: "Book Consultation" },
  { href: "/intake", label: "Intake" },
  { href: "/login", label: "Client Login" },
  { href: "/admin/login", label: "Admin" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 bg-background/52 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-page px-5 py-4 md:px-8 md:py-5">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex flex-col leading-none text-text">
            <span className="text-[11px] uppercase tracking-[0.24em] text-accent">Credu</span>
            <span className="font-display text-[1.9rem] uppercase tracking-[0.08em]">
              Consulting
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm uppercase tracking-[0.12em] text-zinc-300/90 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:block">
            <Button href="/intake">Start Your Credit Review</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] uppercase tracking-[0.18em] text-zinc-300 transition-all duration-200 hover:border-accent/45 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <div className="w-full pt-2">
            <Button href="/intake">Start Your Credit Review</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
