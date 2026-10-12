import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/text';

const PALETTE = [
  'bg-primary-100 text-primary-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
] as const;

/** El color depende del nombre, así la misma persona siempre tiene el mismo color. */
function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0];
}

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'sm' ? 'size-7 text-[11px]' : 'size-10 text-sm',
        colorFor(name),
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
