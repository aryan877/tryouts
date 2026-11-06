import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import type * as React from "react";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform] duration-[80ms] outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-on-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.28)] hover:bg-ink/88 active:translate-y-px active:shadow-[inset_0_-1px_0_rgb(0_0_0/0.28)]",
        outline:
          "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-surface-2 active:translate-y-px",
        ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
      },
      size: {
        default: "h-10 px-4 text-[14px]",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-12 px-5 text-[15px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
