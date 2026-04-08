import type { SelectHTMLAttributes } from "react";
import { useId, useState } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, className, children, onFocus, onBlur, onMouseDown, ...rest }: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  // We can't reliably detect "opened" state of native <select>.
  // This is a pragmatic approximation: open while focused and after mouse down.
  return (
    <div className={`select ${open ? "open" : ""}`}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <select
        id={id}
        className={className}
        onMouseDown={(e) => {
          setOpen(true);
          onMouseDown?.(e);
        }}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          onBlur?.(e);
        }}
        {...rest}
      >
        {children}
      </select>
      <span className="select-arrow" aria-hidden="true" />
    </div>
  );
}

