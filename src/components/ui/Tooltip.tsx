import * as RadixTooltip from '@radix-ui/react-tooltip';
import { type ReactElement, type ReactNode } from 'react';

export interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Debe ser un único elemento capaz de recibir ref (botón, enlace). */
  children: ReactElement;
}

export function Tooltip({ content, side = 'top', children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={10}
          className="z-50 rounded-lg bg-primary-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-popover data-[state=delayed-open]:animate-tooltip-in"
        >
          {content}
          <RadixTooltip.Arrow className="fill-primary-950" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
