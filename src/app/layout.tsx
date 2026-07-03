import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "책 티어리스트",
  description: "함께 책의 티어를 매겨보는 사이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider delay={200}>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
