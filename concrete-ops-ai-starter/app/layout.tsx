import "./globals.css";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";

const sansFont = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Concrete Ops AI",
  description: "Concrete contractor operations platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sansFont.variable} ${monoFont.variable} font-app-sans`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
