'use client';

import { useState } from 'react';

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'gu', label: 'Gujarati' }
];

export function TranscriptTab({
  meetingId,
  transcript,
  initialTranslations
}: {
  meetingId: string;
  transcript: string | null;
  initialTranslations: Record<string, string> | null;
}) {
  const [translations, setTranslations] = useState<Record<string, string>>(initialTranslations ?? {});
  const [targetLanguage, setTargetLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLanguageChange = async (code: string) => {
    setTargetLanguage(code);
    if (!code || translations[code]) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/meetings/${meetingId}/notes/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage: code })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Unable to translate.');
        return;
      }
      setTranslations((prev) => ({ ...prev, [code]: data.translated }));
    } catch {
      setError('Unable to translate. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!transcript) {
    return <p className="text-sm text-muted-foreground">No transcript available for this meeting yet.</p>;
  }

  const displayedText = targetLanguage ? (translations[targetLanguage] ?? null) : transcript;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="transcript-language">
          Language
        </label>
        <select
          id="transcript-language"
          value={targetLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        >
          <option value="">Original</option>
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        {loading ? <span className="text-xs text-muted-foreground">Translating…</span> : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
        {displayedText ?? transcript}
      </p>
    </div>
  );
}
