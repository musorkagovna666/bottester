import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kodaos · FB Mata Avto",
  description: "Autozaliv dashboard at /fbmataavto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
