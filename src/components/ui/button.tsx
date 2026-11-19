import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white hover:bg-[#0e1626]",
        sunset: "bg-sunset-deep text-white hover:bg-[#8e2d20]",
        secondary: "border border-ink/15 bg-white text-ink hover:bg-lavender/60",
        ghost: "bg-transparent text-ink hover:bg-lavender/50",
        danger: "bg-clay text-white hover:bg-[#6f242c]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function buttonClass(
  variant: "primary" | "sunset" | "secondary" | "ghost" | "danger" = "primary",
  className?: string,
) {
  return cn(buttonVariants({ variant }), className);
}

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant ?? "primary", className)} {...props} />;
}
