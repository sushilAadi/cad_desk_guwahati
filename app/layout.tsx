import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const plexSans = Geist({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = Geist_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "CAD Desk Guwahati (NEEED ASSOCIATES) is a CAD/CAM and IT training institute at Noonmati, Guwahati, offering 66+ courses across Civil/Architecture, Mechanical, Electrical, CS/IT, and Creative Arts.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CAD Desk Guwahati | CAD/CAM & IT Training Institute, Noonmati",
    template: "%s | CAD Desk Guwahati",
  },
  description,
  keywords: [
    "CAD training Guwahati",
    "CAM course Guwahati",
    "AutoCAD course Guwahati",
    "SOLIDWORKS training",
    "Revit training",
    "IT training institute Noonmati",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "CAD Desk Guwahati",
    locale: "en_IN",
    url: "/",
    title: "CAD Desk Guwahati | CAD/CAM & IT Training Institute",
    description,
    images: ["/images/hero/categories-collage.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CAD Desk Guwahati | CAD/CAM & IT Training Institute",
    description,
    images: ["/images/hero/categories-collage.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
