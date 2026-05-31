import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kroon — School Uniform ERP',
  description: 'End-to-end school uniform manufacturing and dispatch management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
