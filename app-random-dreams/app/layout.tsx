import type { Metadata } from "next";
import { Domine, Faculty_Glyphic, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
});

const domine = Domine({
  variable: "--font-domine",
  subsets: ["latin"]
});

const facultyGlyphic = Faculty_Glyphic({
  variable: "--font-faculty",
  weight: "400",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: {
    default: "Random Dreams",
    template: "%s · Random Dreams"
  },
  description:
    "Realidades que no pasaron. Elegí un universo y generá tu propia historia alternativa con texto e imagen."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${domine.variable} ${facultyGlyphic.variable}`}>
      <body className="min-h-screen flex flex-col bg-surface text-ink font-body antialiased">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
