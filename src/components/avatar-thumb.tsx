import { cn } from "@/lib/utils";

type Props = {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

export function AvatarThumb({ url, name, size = 36, className }: Props) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const dim = { width: size, height: size };
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? "Member"}
        style={dim}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      style={dim}
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/15 font-display text-primary",
        className,
      )}
    >
      {initial}
    </div>
  );
}
