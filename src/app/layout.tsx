import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const y2k = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-y2k",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://friend-spots.vercel.app",
  ),
  title: {
    default: "Tips",
    template: "%s · Tips",
  },
  description: "Samla tips på karta — stad för stad.",
  openGraph: {
    title: "Tips",
    description: "Samla tips på karta — stad för stad.",
    siteName: "Tips",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tips",
    description: "Samla tips på karta — stad för stad.",
  },
  appleWebApp: {
    title: "Tips",
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
      <body className={`${y2k.variable} min-h-dvh font-sans antialiased`} style={{ fontFamily: "var(--font-y2k), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
