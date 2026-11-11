import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      data-private
      className={cn(
        "ph-no-capture flex field-sizing-content min-h-28 w-full rounded-[var(--gui-radius-s)] border border-[var(--gui-edge)] bg-[var(--gui-control)] px-[var(--gui-space-s)] py-[var(--gui-space-s)] text-[length:var(--gui-text-s)] leading-[var(--gui-leading-s)] tracking-[var(--gui-tracking-l)] text-[var(--gui-text)] outline-none transition-[background-color,color] [transition-duration:var(--gui-motion-small)] placeholder:text-[var(--gui-text-muted-accessible)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gui-focus)] disabled:cursor-not-allowed disabled:bg-[var(--gui-control-disabled)] disabled:text-[var(--gui-neutral-6)] aria-invalid:bg-[var(--gui-error-transparent)] read-only:bg-[var(--gui-control-readonly)] read-only:text-[var(--gui-neutral-8)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
