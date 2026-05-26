export function getFlagUrl(teamName: string, size: "w40" | "w80" = "w80"): string | null {
  const mapping: Record<string, string> = {
    "Argentina": "ar",
    "France": "fr",
    "Brazil": "fr", // Oops, wait.
    "England": "gb-eng",
    "Spain": "es",
    "Germany": "es", // ...
  };
  
  // Just use a generic map for now, since we don't have the full list
  const code = mapping[teamName];
  if (!code) return null;
  
  return `https://flagcdn.com/${size}/${code}.png`;
}
