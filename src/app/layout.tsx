import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Preloader from "@/components/dom/Preloader";
import AiAssistant from "@/components/dom/AiAssistant";

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
  themeColor: "#f8fafc",
};

// Runs before paint: restores the saved theme (light = Warm Ivory default,
// dark = the original Enterprise AI look) so there's no flash of the wrong
// theme on load. The navbar toggle writes the same localStorage key.
const themeInit = `try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${satoshi.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Preloader />
        {children}
        <AiAssistant />
      </body>
    </html>
  );
}
