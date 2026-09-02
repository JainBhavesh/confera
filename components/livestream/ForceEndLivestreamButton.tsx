'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function ForceEndLivestreamButton({ livestreamId }: { livestreamId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleForceEnd = async () => {
    if (!confirm('End this livestream for everyone? Viewers will be disconnected immediately.')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/livestreams/${livestreamId}/force-end`, { method: 'POST' });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleForceEnd} disabled={loading} variant="danger">
      {loading ? 'Ending...' : 'Force end'}
    </Button>
  );
}
