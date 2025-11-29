import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
const font = Inter({ subsets: ["latin"] });

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
