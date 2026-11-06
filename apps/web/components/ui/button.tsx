import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";
import type * as React from "react";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors duration-150 outline-none select-none disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-700 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gray-1000 text-background-100 hover:bg-[hsl(0_0%_22%)] dark:hover:bg-[hsl(0_0%_80%)]",
        secondary:
          "bg-background-100 text-gray-1000 shadow-[0_0_0_1px_var(--ds-gray-alpha-400)] hover:bg-gray-alpha-200",
        tertiary: "text-gray-1000 hover:bg-gray-alpha-200",
      },
      size: {
        sm: "h-8 px-3 text-button-14",
        default: "h-10 px-4 text-button-14",
        lg: "h-12 px-5 text-button-16",
        icon: "size-8",
      },
      shape: {
        default: "",
        rounded: "rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default", shape: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  shape,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
