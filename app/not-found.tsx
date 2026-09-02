import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Card className="max-w-3xl mx-auto p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </Card>
  );
}
