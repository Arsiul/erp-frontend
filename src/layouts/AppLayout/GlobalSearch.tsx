import { CornerDownLeft, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';

import { EASE_OUT_SOFT } from '@/components/motion-presets';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/utils/cn';
import { searchNavigation, type NavMatch } from '@/utils/navigation';

/** Buscador de pantallas del ERP (combobox accesible). Atajo: Ctrl/⌘ + K. */
export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const { can } = useSession();
  const results = useMemo(() => searchNavigation(query, (module) => can(module)), [query, can]);
  const showResults = isOpen && query.trim().length > 0;
  const activeMatch = results[activeIndex];

  useEffect(() => {
    function handleShortcut(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  function goTo(match: NavMatch) {
    void navigate(match.item.path);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setIsOpen(true);
        if (results.length > 0) setActiveIndex((index) => (index + 1) % results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (results.length > 0)
          setActiveIndex((index) => (index - 1 + results.length) % results.length);
        break;
      case 'Enter':
        if (activeMatch) {
          event.preventDefault();
          goTo(activeMatch);
        }
        break;
      case 'Escape':
        if (query) setQuery('');
        else inputRef.current?.blur();
        setIsOpen(false);
        break;
    }
  }

  return (
    <div className="relative w-full max-w-xs">
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Buscar pantallas del ERP"
        aria-expanded={showResults}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          showResults && activeMatch ? `${listboxId}-${activeMatch.item.id}` : undefined
        }
        autoComplete="off"
        placeholder="Buscar módulo..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
        }}
        onBlur={() => {
          setIsOpen(false);
        }}
        onKeyDown={handleKeyDown}
        className="h-10 w-full rounded-xl border border-line bg-white pr-14 pl-10 text-sm text-ink transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-ink-subtle hover:border-primary-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-[10px] font-semibold text-ink-subtle lg:block">
        Ctrl K
      </kbd>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE_OUT_SOFT }}
            className="absolute top-full right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-popover"
          >
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-muted">
                Sin resultados para “{query.trim()}”
              </p>
            ) : (
              <ul id={listboxId} role="listbox" aria-label="Resultados de búsqueda">
                {results.map((match, index) => {
                  const Icon = match.item.icon;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={match.item.id}
                      id={`${listboxId}-${match.item.id}`}
                      role="option"
                      aria-selected={isActive}
                      // Evita que el input pierda el foco (y cierre la lista) antes del clic.
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onMouseEnter={() => {
                        setActiveIndex(index);
                      }}
                      onClick={() => {
                        goTo(match);
                      }}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100',
                        isActive && 'bg-primary-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg',
                          isActive ? 'bg-white text-primary-600' : 'bg-surface text-ink-muted',
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {match.item.label}
                        </span>
                        <span className="block truncate text-xs text-ink-subtle">
                          {match.group.label}
                        </span>
                      </span>
                      {isActive && (
                        <CornerDownLeft className="size-3.5 text-primary-500" aria-hidden />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
