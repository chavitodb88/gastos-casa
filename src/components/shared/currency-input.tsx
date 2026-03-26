"use client";

import { Input } from "@/components/ui/input";
import { forwardRef } from "react";

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: number | string;
  onChange: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          ref={ref}
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="pr-8"
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          &euro;
        </span>
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
