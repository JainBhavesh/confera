'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function CreateLivestreamForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Give your livestream a title.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/livestreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), visibility })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to create livestream.');
        return;
      }

      router.push(`/live/${data.livestream.id}`);
    } catch {
      setError('Unable to create livestream. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="grid gap-4 p-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Start a livestream</h2>
        <p className="mt-2 text-sm text-muted-foreground">Anyone in your organization will be able to watch once you go live.</p>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Livestream title" />
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">Visibility</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVisibility('PRIVATE')}
            className={`flex-1 border px-4 py-2 text-sm font-medium transition ${
              visibility === 'PRIVATE' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Private — org only
          </button>
          <button
            type="button"
            onClick={() => setVisibility('PUBLIC')}
            className={`flex-1 border px-4 py-2 text-sm font-medium transition ${
              visibility === 'PUBLIC' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Public — anyone with the link
          </button>
        </div>
      </div>
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create livestream'}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </Card>
  );
}
