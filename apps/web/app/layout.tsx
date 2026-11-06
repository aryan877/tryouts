import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { MotionProvider } from "@/components/motion-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { listRecords, usingFixture } from "@/lib/records";
import { cn } from "@/lib/utils";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const revalidate = 5;

export const metadata: Metadata = {
  title: {
    default: "Tryouts · Don't pick your AI agent on vibes",
    template: "%s · Tryouts",
  },
  description:
    "A hiring agent creates three coding agents in your Slack. They fix the same real bug. Plain code checks their work, and you hire the winner with one tap. Built on Switch.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
    { media: "(prefers-color-scheme: light)", color: "#f2f3f5" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const records = await listRecords();
  return (
    <html lang="en" suppressHydrationWarning className={cn(archivo.variable, mono.variable)}>
      <body className="flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <TooltipProvider delayDuration={200}>
              <a
                href="#main"
                className="sr-only z-50 rounded-control bg-ink px-3 py-2 font-semibold text-on-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
              >
                Skip to content
              </a>
              <SiteHeader sample={usingFixture} />
              <main id="main" className="flex-1">
                {children}
              </main>
              <SiteFooter records={records.map((record) => record.issue)} />
            </TooltipProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
