import type { Metadata } from 'next';
import './globals.css';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/atoms/Logo';
import { HeaderNav } from '@/components/auth/HeaderNav';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { getCurrentUser } from '@/lib/auth/session';
import { toPublicUser } from '@/services/user.service';

export const metadata: Metadata = {
  title: 'Confera',
  description: 'Secure video meetings for your organization'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-30 border-b border-border bg-card/80 py-3 backdrop-blur">
              <Container>
                <div className="flex items-center justify-between gap-4">
                  <Logo />
                  <div className="flex items-center gap-3">
                    <HeaderNav user={user ? toPublicUser(user) : null} />
                    <ThemeToggle />
                  </div>
                </div>
              </Container>
            </header>
            <main className="py-10">
              <Container>{children}</Container>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
