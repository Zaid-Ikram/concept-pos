import type { Metadata } from "next";
import { Space_Grotesk, Rajdhani } from "next/font/google";
import "./globals.css";
import { ShortcutProvider } from "@/components/providers/ShortcutProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-rajdhani" });

export const metadata: Metadata = {
  title: "Concept Autos POS",
  description: "Modern Point of Sale System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${rajdhani.variable} font-sans bg-zinc-50 text-zinc-900 antialiased`}>
        <AuthProvider>
          <ShortcutProvider>{children}</ShortcutProvider>
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}