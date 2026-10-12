import { ChevronRight, House } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router';

export interface Breadcrumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: readonly Breadcrumb[];
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        <span aria-hidden className="mt-2 block h-[3px] w-8 rounded-full bg-primary-600" />
        {description && <p className="mt-3 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-subtle">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight className="size-3" aria-hidden />}
                    {crumb.to && !isLast ? (
                      <Link
                        to={crumb.to}
                        className="flex items-center gap-1 rounded transition-colors hover:text-primary-700"
                      >
                        {index === 0 && <House className="size-3.5" aria-hidden />}
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? 'page' : undefined}
                        className={isLast ? 'font-semibold text-primary-700' : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
