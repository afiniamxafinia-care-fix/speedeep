import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speedeep — Lee rápido. Entiende más.",
  description: "Entrena tu velocidad de lectura y comprensión, un día a la vez.",
  applicationName: "Speedeep",
};

export const viewport: Viewport = {
  themeColor: "#142a43",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
