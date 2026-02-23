"use client";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  user: { avatarUrl?: string | null; name: string };
  size?: AvatarSize;
  className?: string;
}

const SIZE_MAP: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

function nameColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  const palette = ["#14532d", "#1d4ed8", "#7c2d12", "#4c1d95", "#0f766e", "#9a3412"];
  return palette[Math.abs(hash) % palette.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return (parts[0] || "?").slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({ user, size = "md", className = "" }: AvatarProps) {
  const label = user.name || "Athlete";
  const base = `rounded-full overflow-hidden border border-white/15 flex items-center justify-center font-semibold ${SIZE_MAP[size]} ${className}`;
  if (user.avatarUrl) {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl} alt={label} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={base} style={{ backgroundColor: nameColor(label) }}>
      {initials(label)}
    </div>
  );
}
