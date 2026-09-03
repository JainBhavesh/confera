import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { getResolvedPermissions } from '@/lib/permissions';

const SCOPES = [
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'created', label: 'Created by me' },
  { id: 'all', label: 'All' }
] as const;

export default async function ActionItemsPage({
  searchParams
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await requireUserPage();
  const permissions = await getResolvedPermissions(user);
  const { scope: rawScope } = await searchParams;
  const scope = SCOPES.some((s) => s.id === rawScope) ? (rawScope as (typeof SCOPES)[number]['id']) : 'assigned';

  if (!permissions.canViewActionItems) {
    return (
      <div>
        <h1 className="text-[32px] font-extrabold text-foreground">Action items</h1>
        <p className="mt-4 text-sm text-muted-foreground">You do not have permission to view action items.</p>
      </div>
    );
  }

  const where =
    scope === 'assigned'
      ? { assignedToUserId: user.id }
      : scope === 'created'
        ? { createdByUserId: user.id }
        : { OR: [{ assignedToUserId: user.id }, { createdByUserId: user.id }] };

  const items = await prisma.actionItem.findMany({
    where: { organizationId: user.organizationId, ...where },
    orderBy: { createdAt: 'desc' },
    include: { meeting: { select: { id: true, title: true } } }
  });

  const openCount = items.filter((i) => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length;

  return (
    <div>
      <div className="flex items-end justify-between border-b-2 border-divider pb-5">
        <div>
          <h1 className="mb-1.5 text-[32px] font-extrabold text-foreground">Action items</h1>
          <p className="text-sm text-muted-foreground">Pulled out of your meetings automatically. {openCount} open.</p>
        </div>
        <div className="flex border border-divider">
          {SCOPES.map((s, i) => (
            <Link
              key={s.id}
              href={`/action-items?scope=${s.id}`}
              className={`px-3 py-1.5 text-[13px] ${i > 0 ? 'border-l border-divider' : ''} ${
                scope === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="pt-8 text-sm text-muted-foreground">No action items here.</p>
      ) : (
        <div>
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3.5 border-b border-divider py-4.5">
              <div className="mt-0.5 h-4 w-4 shrink-0 border-[1.5px] border-divider" />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-foreground">{item.title}</div>
                <Link
                  href={`/meetings/${item.meeting.id}`}
                  className="mt-1 block text-xs text-muted-foreground hover:text-foreground"
                >
                  {item.meeting.title}
                </Link>
              </div>
              <span className="whitespace-nowrap bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                {item.dueDate ? `Due ${new Date(item.dueDate).toLocaleDateString()}` : item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
