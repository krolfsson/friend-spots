import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const y2k = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-y2k",
});

export const metadata: Metadata = {
  title: "Tips",
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
