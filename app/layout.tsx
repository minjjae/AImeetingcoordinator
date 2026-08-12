import "@fontsource-variable/dm-sans";
import "@fontsource-variable/newsreader";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Featy | Team scheduling",
  description: "AI-assisted scheduling that understands how your team meets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
