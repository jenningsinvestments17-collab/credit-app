import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "secondaryLight";
};

export function Button({
  href,
  children,
  variant = "primary",
}: ButtonProps) {
  const styles =
    variant === "primary"
      ? "border border-accent/70 bg-accent text-black shadow-glow hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft hover:shadow-[0_24px_50px_rgba(198,169,107,0.22)]"
      : variant === "secondary"
        ? "border border-white/12 bg-white/[0.06] text-white shadow-[0_16px_38px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:border-accent/60 hover:bg-white/[0.11] hover:text-accent"
        : "border border-black/10 bg-white/78 text-text-dark shadow-[0_16px_38px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-accent/45 hover:bg-white hover:text-[#7d6434]";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-14 items-center justify-center rounded-[0.95rem] px-6 text-sm font-semibold tracking-[0.08em] uppercase transition-all duration-200 ${styles}`}
    >
      {children}
    </Link>
  );
}
