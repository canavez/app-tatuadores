import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Ravenn",
  description: "Agenda, clientes e financeiro para tatuadores",
  appleWebApp: { capable: true, title: "Ravenn", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  // "cover" deixa o app ocupar a tela toda no iPhone (respeitando o notch via safe-area).
  viewportFit: "cover",
  themeColor: "#0b0b12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
