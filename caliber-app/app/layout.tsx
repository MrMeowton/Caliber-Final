import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import "../templates/02-3d-asset-viewer/src/features/asset-3d/asset-3d.css";
import "../templates/04-xray-asset-view/src/features/xray/xray.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MIND | Industrial Operations",
  description: "Industrial operations and equipment health dashboard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-[15px] leading-6">{children}</body>
    </html>
  );
}
