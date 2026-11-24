import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Agentation } from "agentation";
import { SITE_URL } from "@/lib/site";
import { CrosshairSections } from "@/components/crosshair-sections";

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

// Paragraph font, taken from the uraniam_fitness project. Used for <p> text only (see globals.css); headings keep Anton.
const matangi = localFont({
  src: "./fonts/matangi-latin.woff2",
  variable: "--font-matangi",
  weight: "300 900",
  style: "normal",
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
    images: ["/images/hero/categories-collage.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CAD Desk Guwahati | CAD/CAM & IT Training Institute",
    description,
    images: ["/images/hero/categories-collage.webp"],
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
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} ${display.variable} ${matangi.variable} h-full antialiased`}
    >
      <head>
        {/* Set the saved theme before first paint so dark mode doesn't flash. Admin stays light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark"&&!location.pathname.startsWith("/admin"))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}
        <CrosshairSections />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
