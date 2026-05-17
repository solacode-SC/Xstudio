import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xstudio",
  description: "Your free PDF studio. No login. No limits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
