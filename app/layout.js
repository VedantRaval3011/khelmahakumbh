import './globals.css';

export const metadata = {
  title: 'Khel Mahakumbh — Surendranagar',
  description: 'Tournament and earnings manager for Khel Mahakumbh, Surendranagar',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
