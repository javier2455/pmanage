"use client";

import * as React from "react";
import {
  usePhoneInput,
  defaultCountries,
  parseCountry,
  type CountryIso2,
} from "react-international-phone";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

function getFlagEmoji(iso2: string) {
  return iso2
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: CountryIso2;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean | "true" | "false";
  className?: string;
}

function PhoneInput({
  value,
  onChange,
  defaultCountry = "cu",
  disabled = false,
  placeholder = "5555 5555",
  className,
  ...props
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { inputValue, phone, country, setCountry, handlePhoneValueChange } =
    usePhoneInput({
      defaultCountry,
      value: value || "",
      countries: defaultCountries,
      forceDialCode: true,
      onChange: (data) => {
        onChange?.(data.phone);
      },
      inputRef,
    });

  const ariaInvalid = props["aria-invalid"];

  return (
    <div
      className={cn(
        "border-input flex h-9 w-full items-center rounded-md border shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/20",
        "focus-within:border-ring focus-within:ring-ring/30 focus-within:ring-[3px]",
        ariaInvalid === true || ariaInvalid === "true"
          ? "border-destructive ring-destructive/20"
          : "",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-full shrink-0 gap-1 rounded-r-none border-r border-input px-2 hover:bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <span className="text-base leading-none">
              {getFlagEmoji(country.iso2)}
            </span>
            <span className="text-xs text-muted-foreground">
              +{country.dialCode}
            </span>
            <ChevronsUpDown className="ml-0.5 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar país..." />
            <CommandList>
              <CommandEmpty>No se encontró el país.</CommandEmpty>
              <CommandGroup>
                {defaultCountries.map((c) => {
                  const parsed = parseCountry(c);
                  return (
                    <CommandItem
                      key={parsed.iso2}
                      value={`${parsed.name} ${parsed.iso2}`}
                      onSelect={() => {
                        setCountry(parsed.iso2);
                        setOpen(false);
                        inputRef.current?.focus();
                      }}
                    >
                      <span className="text-base leading-none">
                        {getFlagEmoji(parsed.iso2)}
                      </span>
                      <span className="flex-1 truncate text-sm">
                        {parsed.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        +{parsed.dialCode}
                      </span>
                      {parsed.iso2 === country.iso2 && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <input
        ref={inputRef}
        type="tel"
        disabled={disabled}
        placeholder={placeholder}
        value={inputValue}
        onChange={handlePhoneValueChange}
        className="placeholder:text-muted-foreground h-full flex-1 bg-transparent px-3 text-base outline-none md:text-sm"
        aria-invalid={ariaInvalid}
      />
    </div>
  );
}

export { PhoneInput };
export type { PhoneInputProps };
