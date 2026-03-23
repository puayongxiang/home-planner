import type { Metadata } from "next";
import { ToasterProvider } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moodcraft",
  description: "Crawl and curate interior design inspiration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToasterProvider>{children}</ToasterProvider>
      </body>
    </html>
  );
}
