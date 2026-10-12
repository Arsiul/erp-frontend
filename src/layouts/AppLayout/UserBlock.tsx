import { Avatar } from '@/components/ui/Avatar';
import { DEMO_USER } from '@/config/app';

export function UserBlock() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={DEMO_USER.name} className="ring-2 ring-primary-100 ring-offset-2" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-bold text-ink uppercase">{DEMO_USER.name}</p>
        <p className="truncate text-xs text-ink-subtle">{DEMO_USER.role}</p>
      </div>
    </div>
  );
}
