import type { Metadata } from "next";
import "./globals.css";

import AuthGate from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "GeoDiscover",
  description:
    "Discover, share and verify the world around you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthGate>
          {children}
        </AuthGate>
      </body>
    </html>
  );
}