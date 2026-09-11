import { Inter, Oswald } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });

export const metadata = {
  title: 'Training Log',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#131417',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}
