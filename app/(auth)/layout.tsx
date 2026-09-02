import { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <Card className="mx-auto max-w-md p-8">{children}</Card>;
}
