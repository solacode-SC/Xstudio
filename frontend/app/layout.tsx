import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xstudio — Precision PDF Workbench",
  description:
    "Zero-retention, high-fidelity PDF studio. Split, merge, compress, organize, stamp, protect, and convert PDFs at print-grade resolution with no sign-up.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex bg-[#FAFAFA] text-[#0A0A0B] selection:bg-[#FF4D00] selection:text-white">
        {children}
      </body>
    </html>
  );
}
