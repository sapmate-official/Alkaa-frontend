import React, { useState, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { COUNTRIES } from '@/constants/countries';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CountrySelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const CountrySelect = React.forwardRef<HTMLButtonElement, CountrySelectProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      placeholder = 'Select country of company...',
      className,
      ...rest
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCountries = useMemo(() => {
      if (!searchTerm.trim()) return COUNTRIES;
      const term = searchTerm.toLowerCase();
      return COUNTRIES.filter((c) => c.toLowerCase().includes(term));
    }, [searchTerm]);

    return (
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-normal',
              !value && 'text-muted-foreground',
              className
            )}
            {...rest}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search country..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-60 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <CommandEmpty>No country found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredCountries.map((country) => (
                    <CommandItem
                      key={country}
                      value={country}
                      onSelect={() => {
                        onChange(country);
                        setOpen(false);
                        setSearchTerm('');
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === country ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {country}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

CountrySelect.displayName = 'CountrySelect';
