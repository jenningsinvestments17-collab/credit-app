import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "@/app/globals.css";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Credu Consulting",
  description: "Credit repair website foundation built with Next.js, TypeScript, and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} font-sans`}>
        <div className="min-h-screen bg-transparent text-text">
          <Navbar />
          <main className="mx-auto flex w-full max-w-page flex-col gap-5 px-5 pb-20 pt-8 md:px-8 md:pt-10">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
