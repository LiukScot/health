import * as SelectPrimitive from "@radix-ui/react-select";
import "./select.css";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  ariaLabel: string;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Accessible select built on Radix (the engine shadcn uses), styled with the
 * app's design tokens to match DateField. Keeps the native <select> contract:
 * a controlled value plus an onValueChange callback.
 */
export function Select({ value, onValueChange, options, ariaLabel, disabled, placeholder }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger className="ui-select-trigger" aria-label={ariaLabel}>
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="ui-select-icon" aria-hidden="true">
          ▾
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={4}>
          <SelectPrimitive.Viewport className="ui-select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={option.value} className="ui-select-item">
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
