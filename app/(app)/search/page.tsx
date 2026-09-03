import Link from 'next/link';
import { requireUserPage } from '@/lib/auth/guards';
import { getResolvedPermissions } from '@/lib/permissions';
import { searchOrg, type SearchKind } from '@/services/search.service';
import { SearchInput } from '@/components/search/SearchInput';

const KIND_TABS: { id: SearchKind; label: string }[] = [
  { id: 'all', label: 'All results' },
  { id: 'SUMMARY', label: 'Summaries' },
  { id: 'TRANSCRIPT', label: 'Transcripts' },
  { id: 'ACTION', label: 'Action items' }
];

const KIND_LABEL: Record<string, string> = { SUMMARY: 'SUMMARY', TRANSCRIPT: 'TRANSCRIPT', ACTION: 'ACTION' };

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; kind?: string }>;
}) {
  const user = await requireUserPage();
  const permissions = await getResolvedPermissions(user);
  const { q = '', kind: rawKind } = await searchParams;
  const kind = (KIND_TABS.some((k) => k.id === rawKind) ? rawKind : 'all') as SearchKind;

  const results = q ? await searchOrg(user.organizationId, q, kind, permissions) : [];

  return (
    <div>
      <h1 className="mb-1 text-[32px] font-extrabold text-foreground">Search notes &amp; transcripts</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Everything said in a meeting, searchable the moment the call ends.
      </p>

      <SearchInput initialQuery={q} />

      <div className="mb-6 mt-3.5 flex gap-2">
        {KIND_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/search?q=${encodeURIComponent(q)}&kind=${tab.id}`}
            className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              kind === tab.id ? 'border border-primary text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {q ? (
        <>
          <div className="border-b-2 border-divider pb-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            {results.length} results
          </div>
          {results.map((r) => (
            <Link
              key={`${r.kind}-${r.meetingId}-${r.when.toISOString()}`}
              href={`/meetings/${r.meetingId}`}
              className="block border-b border-divider py-4.5 hover:bg-muted/40"
            >
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
                  {KIND_LABEL[r.kind]}
                </span>
                <span className="text-[15px] font-semibold text-foreground">{r.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{r.when.toLocaleDateString()}</span>
              </div>
              <div className="text-sm leading-relaxed text-foreground/75">{r.snippet}</div>
            </Link>
          ))}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Start typing to search your organization&apos;s meeting notes and transcripts.</p>
      )}
    </div>
  );
}
