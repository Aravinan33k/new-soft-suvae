import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Preloader from "@/components/dom/Preloader";
import AiAssistant from "@/components/dom/AiAssistant";
import SmoothScroll from "@/components/dom/SmoothScroll";

// Satoshi — the site's primary typeface (self-hosted variable font, all
// weights 300–900). Exposed as --font-satoshi and mapped to --font-sans in
// globals.css so every element uses it by default.
const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Geist Mono is kept only for the handful of tabular-numeral / index labels
// that intentionally use a monospace face.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soft Suave — Scalable AI, Automation & Integrations",
  description:
    "Build scalable AI solutions, intelligent automation systems, and seamless integrations with AI-enabled engineering teams focused on real business outcomes.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
};

// Runs before paint: the site is dark-only for now — always keep the dark
// "Enterprise AI" theme and clear any previously-saved "light" preference so
// a stuck light choice can't force the white palette. (<html> already ships
// with data-theme="dark".) To restore the light/dark toggle, revert this to
// only remove data-theme when localStorage.theme === "light".
const themeInit = `try{document.documentElement.setAttribute("data-theme","dark");localStorage.setItem("theme","dark")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${satoshi.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <SmoothScroll />
        <Preloader />
        {children}
        <AiAssistant />
      </body>
    </html>
  );
}
