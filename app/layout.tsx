import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ConditionalHeader from "../components/shared/ConditionalHeader";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { LocaleProvider } from "../components/providers/LocaleProvider";
import { siteConfig } from "@/lib/site-config";

const cairo = Cairo({
  subsets: ["latin", "arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.nameAr,
    template: `%s | ${siteConfig.nameAr}`,
  },
  description: siteConfig.description,
  keywords: [
    "payment system",
    "money transfer",
    "fintech",
    "Next.js",
    "FastAPI",
    "portfolio",
    "حوالات مالية",
    "نظام مدفوعات",
  ],
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: siteConfig.url,
    title: siteConfig.nameAr,
    description: siteConfig.description,
    siteName: siteConfig.nameAr,
    images: [{ url: "/payment-system.jpg", width: 512, height: 512, alt: siteConfig.nameAr }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.nameAr,
    description: siteConfig.description,
    images: ["/payment-system.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/payment-system.ico" type="image/x-icon" />
      </head>
      <body className={`${cairo.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
        <LocaleProvider>
          <ThemeProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#1e293b",
                  color: "#f1f5f9",
                  border: "1px solid rgba(255,255,255,0.1)",
                },
              }}
            />
            <ConditionalHeader />
            {children}
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
