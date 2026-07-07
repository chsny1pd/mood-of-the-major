import { getInitials } from "../../utils/initials";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function Avatar({ src, alt, name, email, size = "md", className = "" }: AvatarProps) {
  const initials = getInitials(name, email);
  const label = alt ?? name ?? email ?? "User";

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`rounded-full object-cover ring-2 ring-stone-200 dark:ring-stone-700 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden={Boolean(alt)}
      className={`inline-flex items-center justify-center rounded-full bg-teal-700 font-semibold text-white ring-2 ring-stone-200 dark:bg-teal-600 dark:ring-stone-700 ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </span>
  );
}
