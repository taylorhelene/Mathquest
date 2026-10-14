import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Quest",
  description:
    "Explore maths through short, interactive lessons. Mobile-friendly with optional AR and step-by-step tutor hints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
