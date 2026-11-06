import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { listRecords, usingFixture } from "@/lib/records";
import { cn } from "@/lib/utils";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const revalidate = 5;

export const metadata: Metadata = {
  title: {
    default: "Tryouts · Don't pick your AI coding tool on vibes",
    template: "%s · Tryouts",
  },
  description:
    "Several AI coding tools try out on the same real bug. Plain code checks each fix. Your team lead hires the best one with one button. Built on Switch.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const records = await listRecords();
  const latest = records.find((record) => record.hire) ?? records[0];
  return (
    <html lang="en" suppressHydrationWarning className={cn(sans.variable, mono.variable)}>
      <body className="flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={150}>
            <a
              href="#main"
              className="sr-only z-50 rounded-md bg-gray-1000 px-3 py-2 text-button-14 text-background-100 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
              Skip to content
            </a>
            <SiteHeader run={latest ? `/tryouts/${latest.issue}` : null} sample={usingFixture} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter records={records.map((record) => record.issue)} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
