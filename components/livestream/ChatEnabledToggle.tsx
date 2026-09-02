'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function ChatEnabledToggle({ livestreamId, initialEnabled }: { livestreamId: string; initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const next = !enabled;
    try {
      const response = await fetch(`/api/livestreams/${livestreamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatEnabled: next })
      });
      if (response.ok) {
        setEnabled(next);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleToggle} disabled={loading} variant="secondary">
      {loading ? 'Saving...' : enabled ? 'Disable chat' : 'Enable chat'}
    </Button>
  );
}
