interface AmbientBackgroundProps {
  className?: string;
  variant?: "hero" | "subtle";
}

export function AmbientBackground({ className = "", variant = "hero" }: AmbientBackgroundProps) {
  const variantClass = variant === "subtle" ? "ambient-glow ambient-glow--subtle" : "ambient-glow";
  return <div aria-hidden="true" className={`${variantClass} ${className}`.trim()} />;
}
