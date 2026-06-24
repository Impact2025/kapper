import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "white" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:opacity-90 active:scale-95 soft-shadow",
  outline:
    "border-2 border-primary text-primary hover:bg-primary/5 active:scale-95",
  white:
    "bg-white text-primary hover:bg-surface-container-low active:scale-95 shadow-lg",
  ghost: "text-primary hover:bg-primary/5",
};

const sizes: Record<Size, string> = {
  sm: "px-md py-xs text-label-md",
  md: "px-xl py-sm text-label-md",
  lg: "px-xl py-md text-label-md",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-base rounded-full font-label-md transition-all",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
}: CommonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-base rounded-full font-label-md transition-all",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
