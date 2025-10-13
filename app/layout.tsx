import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voucher Management System',
  description: 'Sistem manajemen voucher untuk toko jam tangan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
