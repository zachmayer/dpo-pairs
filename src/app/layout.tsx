import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: 'DPO Review App',
  description: 'An app for manually reviewing data for Direct Preference Optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistMono.variable} ${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
