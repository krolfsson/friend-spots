import type { Metadata, Viewport } from "next";
import { Fredoka, M_PLUS_Rounded_1c } from "next/font/google";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import "./globals.css";

const y2k = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-y2k",
});

const logo = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://friend-spots.vercel.app",
  ),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_TITLE,
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    title: SITE_TITLE,
    capable: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${y2k.variable} ${logo.variable} min-h-dvh font-sans antialiased`}
        style={{ fontFamily: "var(--font-y2k), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
