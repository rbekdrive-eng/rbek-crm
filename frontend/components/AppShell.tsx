import './globals.css';

export const metadata = {
  title: 'R.BEK Intelligence Platform',
  description:
    'Inteligência comercial para engenharia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
