'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect = React.memo(function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Chọn...',
  searchPlaceholder = 'Tìm kiếm...',
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number>(200);

  const selectedLabel = React.useMemo(
    () => options.find(o => o.value === value)?.label ?? '',
    [options, value]
  );

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');

  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = normalize(search);
    return options.filter(o => normalize(o.label).includes(q));
  }, [options, search]);

  const handleOpen = (val: boolean) => {
    if (disabled) return;
    if (val && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
    setOpen(val);
    if (!val) setSearch('');
  };

  // Focus input khi mở
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          type="button"
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-10 px-3',
            !selectedLabel && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate text-left flex-1">
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 z-[9999]"
        style={{ width: triggerWidth }}
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            placeholder={searchPlaceholder}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Options list */}
        <div className="max-h-[220px] overflow-y-auto overscroll-contain">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy
            </p>
          ) : (
            filtered.map(opt => (
              <div
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onMouseDown={e => {
                  // dùng onMouseDown để tránh blur input trước khi click
                  e.preventDefault();
                  onValueChange(opt.value);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none',
                  'hover:bg-accent hover:text-accent-foreground',
                  opt.value === value && 'bg-accent font-medium'
                )}
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    opt.value === value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{opt.label}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
