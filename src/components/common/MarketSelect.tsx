import React, { useState, useEffect, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PREDEFINED_MARKETS, OTHER_MARKET_KEY, resolveMarketSelection } from '@/constants/markets';
import { cn } from '@/lib/utils';

export interface MarketSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  customPlaceholder?: string;
  triggerClassName?: string;
}

export const MarketSelect = React.forwardRef<HTMLDivElement, MarketSelectProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      placeholder = 'Select market/industry...',
      customPlaceholder = 'Specify your market...',
      className,
      triggerClassName,
      ...rest
    },
    ref
  ) => {
    const { selectValue: initialSelect, customValue: initialCustom } = resolveMarketSelection(value);
    const [selectedOption, setSelectedOption] = useState<string>(initialSelect);
    const [customText, setCustomText] = useState<string>(initialCustom);

    const inputRef = useRef<HTMLInputElement>(null);
    const lastEmittedValueRef = useRef<string | null | undefined>(value);

    // Sync internal state when external value changes from outside (e.g. form reset, async data load)
    useEffect(() => {
      if (value === lastEmittedValueRef.current) {
        return;
      }
      lastEmittedValueRef.current = value;
      const { selectValue, customValue } = resolveMarketSelection(value);
      setSelectedOption(selectValue);
      setCustomText(customValue);
    }, [value]);

    const handleSelectChange = (val: string) => {
      if (val === OTHER_MARKET_KEY) {
        setSelectedOption(OTHER_MARKET_KEY);
        // If there's already custom text typed, keep it; otherwise emit 'Other'
        const emitted = customText.trim() ? customText : OTHER_MARKET_KEY;
        lastEmittedValueRef.current = emitted;
        onChange(emitted);

        // Focus the custom input smoothly after Radix Select dropdown closes
        setTimeout(() => {
          inputRef.current?.focus();
        }, 80);
      } else {
        setSelectedOption(val);
        setCustomText('');
        lastEmittedValueRef.current = val;
        onChange(val);
      }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextText = e.target.value;
      setCustomText(nextText);
      // Emit the text if present, or fallback to 'Other' so parent retains non-empty market selection
      const emitted = nextText.length > 0 ? nextText : OTHER_MARKET_KEY;
      lastEmittedValueRef.current = emitted;
      onChange(emitted);
    };

    const handleCustomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const trimmed = e.target.value.trim();
      if (trimmed !== customText) {
        setCustomText(trimmed);
      }
      const finalValue = trimmed ? trimmed : OTHER_MARKET_KEY;
      if (finalValue !== lastEmittedValueRef.current) {
        lastEmittedValueRef.current = finalValue;
        onChange(finalValue);
      }
    };

    return (
      <div ref={ref} className={cn('space-y-2 w-full', className)} {...rest}>
        <Select
          value={selectedOption || undefined}
          onValueChange={handleSelectChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn('w-full', triggerClassName)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {PREDEFINED_MARKETS.map((market) => (
              <SelectItem key={market} value={market}>
                {market}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedOption === OTHER_MARKET_KEY && (
          <Input
            ref={inputRef}
            type="text"
            value={customText}
            onChange={handleCustomChange}
            onBlur={handleCustomBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            placeholder={customPlaceholder}
            disabled={disabled}
            className="h-9 text-sm"
          />
        )}
      </div>
    );
  }
);

MarketSelect.displayName = 'MarketSelect';
