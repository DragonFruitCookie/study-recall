import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyRecall",
  description: "Spaced-repetition revision tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
