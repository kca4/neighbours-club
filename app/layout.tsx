import type { Metadata } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://neighborsclub.ca"),
  title: {
    default: "Neighbours Club",
    template: "%s | Neighbours Club",
  },
  description:
    "Kanata's local intelligence and group buying platform. Know what's happening. Save together.",
  openGraph: {
    title: "Neighbours Club",
    description:
      "Kanata's local intelligence and group buying platform. Know what's happening. Save together.",
    type: "website",
    siteName: "Neighbours Club",
    locale: "en_CA",
    url: "https://neighborsclub.ca",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased" suppressHydrationWarning>
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
