import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import { Metadata } from "next";

const font = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Divine Mercy Retreat Center | DMRC',
    template: '%s | DMRC'
  },
  description: 'Divine Mercy Retreat Center (DMRC) Vikindu - A sanctuary of peace and prayer in Tanzania, East Africa. Offering retreats, spiritual programs, and community outreach.',
  keywords: ['DMRC', 'Divine Mercy', 'Retreat Center', 'Tanzania', 'Vikindu', 'Spiritual Retreat', 'Prayer', 'Faith'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
