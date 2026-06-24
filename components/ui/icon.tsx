import { cn } from "@/lib/utils";

type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
};

/** Material Symbols Outlined icon. The font is loaded in the root layout. */
export function Icon({ name, className, filled, style }: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined select-none", className)}
      style={{
        ...(filled ? { fontVariationSettings: "'FILL' 1, 'wght' 300" } : {}),
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
