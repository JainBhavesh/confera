import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/theme/ThemeProvider';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-archivo'
});

export const metadata: Metadata = {
  title: 'Confera',
  description: 'Secure video meetings for your organization'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={archivo.variable}>
      <head suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
