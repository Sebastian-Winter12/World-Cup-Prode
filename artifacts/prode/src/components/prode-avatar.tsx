export const PRODE_AVATARS = [
  { id: "ball", emoji: "⚽", bg: "#1d5c3e" },
  { id: "trophy", emoji: "🏆", bg: "#78350f" },
  { id: "gloves", emoji: "🧤", bg: "#991b1b" },
  { id: "boot", emoji: "👟", bg: "#1e3a8a" },
  { id: "medal", emoji: "🥇", bg: "#92400e" },
  { id: "fire", emoji: "🔥", bg: "#c2410c" },
  { id: "star", emoji: "⭐", bg: "#064e3b" },
  { id: "crown", emoji: "👑", bg: "#713f12" },
  { id: "lion", emoji: "🦁", bg: "#92400e" },
  { id: "eagle", emoji: "🦅", bg: "#1e3a5f" },
  { id: "wolf", emoji: "🐺", bg: "#374151" },
  { id: "bull", emoji: "🐂", bg: "#7f1d1d" },
  { id: "tiger", emoji: "🐯", bg: "#b45309" },
  { id: "bear", emoji: "🐻", bg: "#1c1917" },
  { id: "fox", emoji: "🦊", bg: "#9a3412" },
  { id: "shark", emoji: "🦈", bg: "#0c4a6e" },
  { id: "lightning", emoji: "⚡", bg: "#3730a3" },
  { id: "shield", emoji: "🛡️", bg: "#1e3a5f" },
  { id: "rocket", emoji: "🚀", bg: "#312e81" },
  { id: "gem", emoji: "💎", bg: "#0e7490" },
  { id: "target", emoji: "🎯", bg: "#7f1d1d" },
  { id: "dragon", emoji: "🐉", bg: "#14532d" },
  { id: "planet", emoji: "🌍", bg: "#1e3a8a" },
  { id: "flame", emoji: "🕯️", bg: "#78350f" },
] as const;

export type AvatarId = typeof PRODE_AVATARS[number]["id"];

export function getAvatarInfo(avatarUrl: string | null | undefined) {
  if (!avatarUrl?.startsWith("prode-avatar:")) return null;
  const id = avatarUrl.slice("prode-avatar:".length);
  return PRODE_AVATARS.find(a => a.id === id) ?? null;
}

interface ProdeAvatarProps {
  avatarUrl: string | null | undefined;
  username: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { outer: "h-8 w-8", text: "text-base" },
  md: { outer: "h-10 w-10", text: "text-lg" },
  lg: { outer: "h-16 w-16", text: "text-3xl" },
  xl: { outer: "h-24 w-24", text: "text-5xl" },
};

export function ProdeAvatar({ avatarUrl, username, size = "md", className = "" }: ProdeAvatarProps) {
  const info = getAvatarInfo(avatarUrl);
  const sizes = sizeMap[size];

  if (info) {
    return (
      <div
        className={`${sizes.outer} rounded-full flex items-center justify-center border-2 border-background shadow-lg flex-shrink-0 ${className}`}
        style={{ background: info.bg }}
      >
        <span className={sizes.text} role="img" aria-label={info.id}>{info.emoji}</span>
      </div>
    );
  }

  if (avatarUrl && !avatarUrl.startsWith("prode-avatar:")) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizes.outer} rounded-full object-cover border-2 border-background shadow-lg flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes.outer} rounded-full flex items-center justify-center border-2 border-background shadow-lg bg-muted flex-shrink-0 ${className}`}
    >
      <span className={`${sizes.text} font-bold text-muted-foreground`}>
        {username.substring(0, 2).toUpperCase()}
      </span>
    </div>
  );
}
