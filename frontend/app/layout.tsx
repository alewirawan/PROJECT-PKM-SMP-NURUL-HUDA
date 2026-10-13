import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { MotionEnhancer } from "./components/MotionEnhancer";
import { SchoolSettingsProvider } from "./components/SchoolSettingsProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "SMP Nurul Huda — Berani Belajar, Siap Berkarya",
    template: "%s | SMP Nurul Huda",
  },
  description:
    "Website resmi simulasi SMP Nurul Huda, sekolah yang memadukan keunggulan akademik, karakter, dan keterampilan masa depan.",
  openGraph: {
    title: "SMP Nurul Huda",
    description: "Berani Belajar. Siap Berkarya.",
    images: [
      { url: "/og.jpg", width: 1200, height: 627, alt: "SMP Nurul Huda" },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SMP Nurul Huda",
    description: "Berani Belajar. Siap Berkarya.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} antialiased`}>
        <SchoolSettingsProvider>
          <MotionEnhancer />
          {children}
        </SchoolSettingsProvider>
      </body>
    </html>
  );
}
