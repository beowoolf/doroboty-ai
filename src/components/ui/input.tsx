import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-private
      className={cn(
        "ph-no-capture min-h-12 w-full min-w-0 rounded-[var(--gui-radius-s)] border border-[var(--gui-edge)] bg-[var(--gui-control)] px-[var(--gui-space-s)] py-[var(--gui-space-s)] text-[length:var(--gui-text-s)] leading-[var(--gui-leading-s)] tracking-[var(--gui-tracking-l)] text-[var(--gui-text)] outline-none transition-[background-color,color] [transition-duration:var(--gui-motion-small)] file:inline-flex file:border border-[var(--gui-edge)] file:bg-transparent file:font-medium file:text-[var(--gui-text)] placeholder:text-[var(--gui-text-muted-accessible)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gui-focus)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--gui-control-disabled)] disabled:text-[var(--gui-neutral-6)] aria-invalid:bg-[var(--gui-error-transparent)] read-only:bg-[var(--gui-control-readonly)] read-only:text-[var(--gui-neutral-8)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
