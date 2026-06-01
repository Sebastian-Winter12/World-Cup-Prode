/**
 * Official FIFA World Cup 2026 match seeder.
 * Source: FIFA Scores & Fixtures — https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures
 * All kickoff times are stored in UTC (EDT = UTC-4 during tournament).
 * Re-run this script to refresh fixture data: pnpm --filter @workspace/scripts run seed-matches
 */

import { db } from "@workspace/db";
import { matchesTable as matches } from "@workspace/db/schema";

// ISO 3166-1 alpha-2 codes for flag CDN
const flag = (code: string) => `https://flagcdn.com/w40/${code}.png`;

const F = {
  mexico: flag("mx"),
  southAfrica: flag("za"),
  koreaRepublic: flag("kr"),
  czechia: flag("cz"),
  canada: flag("ca"),
  bosnia: flag("ba"),
  qatar: flag("qa"),
  switzerland: flag("ch"),
  brazil: flag("br"),
  morocco: flag("ma"),
  haiti: flag("ht"),
  scotland: flag("gb-sct"),
  usa: flag("us"),
  paraguay: flag("py"),
  australia: flag("au"),
  turkey: flag("tr"),
  germany: flag("de"),
  curacao: flag("cw"),
  ivoryCoast: flag("ci"),
  ecuador: flag("ec"),
  netherlands: flag("nl"),
  japan: flag("jp"),
  sweden: flag("se"),
  tunisia: flag("tn"),
  belgium: flag("be"),
  egypt: flag("eg"),
  iran: flag("ir"),
  newZealand: flag("nz"),
  spain: flag("es"),
  capeVerde: flag("cv"),
  saudiArabia: flag("sa"),
  uruguay: flag("uy"),
  france: flag("fr"),
  senegal: flag("sn"),
  iraq: flag("iq"),
  norway: flag("no"),
  argentina: flag("ar"),
  algeria: flag("dz"),
  austria: flag("at"),
  jordan: flag("jo"),
  portugal: flag("pt"),
  drCongo: flag("cd"),
  uzbekistan: flag("uz"),
  colombia: flag("co"),
  england: flag("gb-eng"),
  croatia: flag("hr"),
  ghana: flag("gh"),
  panama: flag("pa"),
};

// Helper: convert ET date/time to UTC ISO string (EDT = UTC-4)
function et(dateStr: string, time: string): string {
  const [month, day] = dateStr.split(" ");
  const months: Record<string, string> = {
    Jun: "06", Jul: "07",
  };
  const m = months[month];
  const d = day.padStart(2, "0");

  // Parse time "3:00 PM" / "10:00 PM" / "12:00 AM" / "midnight"
  let hour = 0;
  let minute = 0;
  if (time.toLowerCase() === "midnight") {
    hour = 0; minute = 0;
  } else {
    const [timePart, period] = time.split(" ");
    const [h, min] = timePart.split(":").map(Number);
    hour = h;
    minute = min ?? 0;
    if (period === "PM" && h !== 12) hour += 12;
    if (period === "AM" && h === 12) hour = 0;
  }

  // Add 4 hours to convert EDT → UTC
  let utcHour = hour + 4;
  let dayOffset = 0;
  if (utcHour >= 24) {
    utcHour -= 24;
    dayOffset = 1;
  }

  const dateObj = new Date(`2026-${m}-${d}T00:00:00Z`);
  dateObj.setUTCDate(dateObj.getUTCDate() + dayOffset);
  dateObj.setUTCHours(utcHour, minute, 0, 0);
  return dateObj.toISOString();
}

type MatchSeed = {
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  matchDate: string;
  stadium: string;
  stage: string;
  matchday: number;
  group: string | null;
  status: string;
};

const fixtures: MatchSeed[] = [
  // ─── GROUP A: Mexico, South Africa, Korea Republic, Czechia ───────────
  { homeTeam: "Mexico", awayTeam: "South Africa", homeFlag: F.mexico, awayFlag: F.southAfrica, matchDate: et("Jun 11", "3:00 PM"), stadium: "Estadio Azteca, Mexico City", stage: "Group Stage", matchday: 1, group: "Group A", status: "scheduled" },
  { homeTeam: "Korea Republic", awayTeam: "Czechia", homeFlag: F.koreaRepublic, awayFlag: F.czechia, matchDate: et("Jun 11", "10:00 PM"), stadium: "Estadio Akron, Guadalajara", stage: "Group Stage", matchday: 1, group: "Group A", status: "scheduled" },
  { homeTeam: "Czechia", awayTeam: "South Africa", homeFlag: F.czechia, awayFlag: F.southAfrica, matchDate: et("Jun 18", "12:00 PM"), stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Group Stage", matchday: 2, group: "Group A", status: "scheduled" },
  { homeTeam: "Mexico", awayTeam: "Korea Republic", homeFlag: F.mexico, awayFlag: F.koreaRepublic, matchDate: et("Jun 18", "9:00 PM"), stadium: "Estadio Akron, Zapopan", stage: "Group Stage", matchday: 2, group: "Group A", status: "scheduled" },
  { homeTeam: "Czechia", awayTeam: "Mexico", homeFlag: F.czechia, awayFlag: F.mexico, matchDate: et("Jun 24", "9:00 PM"), stadium: "Estadio Azteca, Mexico City", stage: "Group Stage", matchday: 3, group: "Group A", status: "scheduled" },
  { homeTeam: "South Africa", awayTeam: "Korea Republic", homeFlag: F.southAfrica, awayFlag: F.koreaRepublic, matchDate: et("Jun 24", "9:00 PM"), stadium: "Estadio BBVA, Monterrey", stage: "Group Stage", matchday: 3, group: "Group A", status: "scheduled" },

  // ─── GROUP B: Canada, Bosnia & Herzegovina, Qatar, Switzerland ─────────
  { homeTeam: "Canada", awayTeam: "Bosnia & Herzegovina", homeFlag: F.canada, awayFlag: F.bosnia, matchDate: et("Jun 12", "3:00 PM"), stadium: "BMO Field, Toronto", stage: "Group Stage", matchday: 1, group: "Group B", status: "scheduled" },
  { homeTeam: "Qatar", awayTeam: "Switzerland", homeFlag: F.qatar, awayFlag: F.switzerland, matchDate: et("Jun 13", "3:00 PM"), stadium: "Levi's Stadium, San Francisco", stage: "Group Stage", matchday: 1, group: "Group B", status: "scheduled" },
  { homeTeam: "Switzerland", awayTeam: "Bosnia & Herzegovina", homeFlag: F.switzerland, awayFlag: F.bosnia, matchDate: et("Jun 18", "3:00 PM"), stadium: "SoFi Stadium, Los Angeles", stage: "Group Stage", matchday: 2, group: "Group B", status: "scheduled" },
  { homeTeam: "Canada", awayTeam: "Qatar", homeFlag: F.canada, awayFlag: F.qatar, matchDate: et("Jun 18", "6:00 PM"), stadium: "BC Place, Vancouver", stage: "Group Stage", matchday: 2, group: "Group B", status: "scheduled" },
  { homeTeam: "Switzerland", awayTeam: "Canada", homeFlag: F.switzerland, awayFlag: F.canada, matchDate: et("Jun 24", "3:00 PM"), stadium: "BC Place, Vancouver", stage: "Group Stage", matchday: 3, group: "Group B", status: "scheduled" },
  { homeTeam: "Bosnia & Herzegovina", awayTeam: "Qatar", homeFlag: F.bosnia, awayFlag: F.qatar, matchDate: et("Jun 24", "3:00 PM"), stadium: "Lumen Field, Seattle", stage: "Group Stage", matchday: 3, group: "Group B", status: "scheduled" },

  // ─── GROUP C: Brazil, Morocco, Haiti, Scotland ─────────────────────────
  { homeTeam: "Brazil", awayTeam: "Morocco", homeFlag: F.brazil, awayFlag: F.morocco, matchDate: et("Jun 13", "6:00 PM"), stadium: "MetLife Stadium, New York/NJ", stage: "Group Stage", matchday: 1, group: "Group C", status: "scheduled" },
  { homeTeam: "Haiti", awayTeam: "Scotland", homeFlag: F.haiti, awayFlag: F.scotland, matchDate: et("Jun 13", "9:00 PM"), stadium: "Gillette Stadium, Boston", stage: "Group Stage", matchday: 1, group: "Group C", status: "scheduled" },
  { homeTeam: "Scotland", awayTeam: "Morocco", homeFlag: F.scotland, awayFlag: F.morocco, matchDate: et("Jun 19", "6:00 PM"), stadium: "Gillette Stadium, Boston", stage: "Group Stage", matchday: 2, group: "Group C", status: "scheduled" },
  { homeTeam: "Brazil", awayTeam: "Haiti", homeFlag: F.brazil, awayFlag: F.haiti, matchDate: et("Jun 19", "9:00 PM"), stadium: "Lincoln Financial Field, Philadelphia", stage: "Group Stage", matchday: 2, group: "Group C", status: "scheduled" },
  { homeTeam: "Scotland", awayTeam: "Brazil", homeFlag: F.scotland, awayFlag: F.brazil, matchDate: et("Jun 24", "6:00 PM"), stadium: "Hard Rock Stadium, Miami", stage: "Group Stage", matchday: 3, group: "Group C", status: "scheduled" },
  { homeTeam: "Morocco", awayTeam: "Haiti", homeFlag: F.morocco, awayFlag: F.haiti, matchDate: et("Jun 24", "6:00 PM"), stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Group Stage", matchday: 3, group: "Group C", status: "scheduled" },

  // ─── GROUP D: USA, Paraguay, Australia, Türkiye ────────────────────────
  { homeTeam: "USA", awayTeam: "Paraguay", homeFlag: F.usa, awayFlag: F.paraguay, matchDate: et("Jun 12", "9:00 PM"), stadium: "SoFi Stadium, Los Angeles", stage: "Group Stage", matchday: 1, group: "Group D", status: "scheduled" },
  { homeTeam: "Australia", awayTeam: "Türkiye", homeFlag: F.australia, awayFlag: F.turkey, matchDate: et("Jun 13", "midnight"), stadium: "BC Place, Vancouver", stage: "Group Stage", matchday: 1, group: "Group D", status: "scheduled" },
  { homeTeam: "USA", awayTeam: "Australia", homeFlag: F.usa, awayFlag: F.australia, matchDate: et("Jun 19", "3:00 PM"), stadium: "Lumen Field, Seattle", stage: "Group Stage", matchday: 2, group: "Group D", status: "scheduled" },
  { homeTeam: "Türkiye", awayTeam: "Paraguay", homeFlag: F.turkey, awayFlag: F.paraguay, matchDate: et("Jun 19", "midnight"), stadium: "Levi's Stadium, San Francisco", stage: "Group Stage", matchday: 2, group: "Group D", status: "scheduled" },
  { homeTeam: "Türkiye", awayTeam: "USA", homeFlag: F.turkey, awayFlag: F.usa, matchDate: et("Jun 25", "10:00 PM"), stadium: "SoFi Stadium, Los Angeles", stage: "Group Stage", matchday: 3, group: "Group D", status: "scheduled" },
  { homeTeam: "Paraguay", awayTeam: "Australia", homeFlag: F.paraguay, awayFlag: F.australia, matchDate: et("Jun 25", "10:00 PM"), stadium: "Levi's Stadium, San Francisco", stage: "Group Stage", matchday: 3, group: "Group D", status: "scheduled" },

  // ─── GROUP E: Germany, Curaçao, Côte d'Ivoire, Ecuador ─────────────────
  { homeTeam: "Germany", awayTeam: "Curaçao", homeFlag: F.germany, awayFlag: F.curacao, matchDate: et("Jun 14", "1:00 PM"), stadium: "NRG Stadium, Houston", stage: "Group Stage", matchday: 1, group: "Group E", status: "scheduled" },
  { homeTeam: "Côte d'Ivoire", awayTeam: "Ecuador", homeFlag: F.ivoryCoast, awayFlag: F.ecuador, matchDate: et("Jun 14", "7:00 PM"), stadium: "Lincoln Financial Field, Philadelphia", stage: "Group Stage", matchday: 1, group: "Group E", status: "scheduled" },
  { homeTeam: "Germany", awayTeam: "Côte d'Ivoire", homeFlag: F.germany, awayFlag: F.ivoryCoast, matchDate: et("Jun 20", "4:00 PM"), stadium: "BMO Field, Toronto", stage: "Group Stage", matchday: 2, group: "Group E", status: "scheduled" },
  { homeTeam: "Ecuador", awayTeam: "Curaçao", homeFlag: F.ecuador, awayFlag: F.curacao, matchDate: et("Jun 20", "8:00 PM"), stadium: "Arrowhead Stadium, Kansas City", stage: "Group Stage", matchday: 2, group: "Group E", status: "scheduled" },
  { homeTeam: "Ecuador", awayTeam: "Germany", homeFlag: F.ecuador, awayFlag: F.germany, matchDate: et("Jun 25", "4:00 PM"), stadium: "MetLife Stadium, New York/NJ", stage: "Group Stage", matchday: 3, group: "Group E", status: "scheduled" },
  { homeTeam: "Curaçao", awayTeam: "Côte d'Ivoire", homeFlag: F.curacao, awayFlag: F.ivoryCoast, matchDate: et("Jun 25", "4:00 PM"), stadium: "Lincoln Financial Field, Philadelphia", stage: "Group Stage", matchday: 3, group: "Group E", status: "scheduled" },

  // ─── GROUP F: Netherlands, Japan, Sweden, Tunisia ──────────────────────
  { homeTeam: "Netherlands", awayTeam: "Japan", homeFlag: F.netherlands, awayFlag: F.japan, matchDate: et("Jun 14", "4:00 PM"), stadium: "AT&T Stadium, Dallas", stage: "Group Stage", matchday: 1, group: "Group F", status: "scheduled" },
  { homeTeam: "Sweden", awayTeam: "Tunisia", homeFlag: F.sweden, awayFlag: F.tunisia, matchDate: et("Jun 14", "10:00 PM"), stadium: "Estadio BBVA, Monterrey", stage: "Group Stage", matchday: 1, group: "Group F", status: "scheduled" },
  { homeTeam: "Netherlands", awayTeam: "Sweden", homeFlag: F.netherlands, awayFlag: F.sweden, matchDate: et("Jun 20", "1:00 PM"), stadium: "NRG Stadium, Houston", stage: "Group Stage", matchday: 2, group: "Group F", status: "scheduled" },
  { homeTeam: "Tunisia", awayTeam: "Japan", homeFlag: F.tunisia, awayFlag: F.japan, matchDate: et("Jun 20", "midnight"), stadium: "Estadio BBVA, Monterrey", stage: "Group Stage", matchday: 2, group: "Group F", status: "scheduled" },
  { homeTeam: "Japan", awayTeam: "Sweden", homeFlag: F.japan, awayFlag: F.sweden, matchDate: et("Jun 25", "7:00 PM"), stadium: "AT&T Stadium, Dallas", stage: "Group Stage", matchday: 3, group: "Group F", status: "scheduled" },
  { homeTeam: "Tunisia", awayTeam: "Netherlands", homeFlag: F.tunisia, awayFlag: F.netherlands, matchDate: et("Jun 25", "7:00 PM"), stadium: "Arrowhead Stadium, Kansas City", stage: "Group Stage", matchday: 3, group: "Group F", status: "scheduled" },

  // ─── GROUP G: Belgium, Egypt, Iran, New Zealand ────────────────────────
  { homeTeam: "Belgium", awayTeam: "Egypt", homeFlag: F.belgium, awayFlag: F.egypt, matchDate: et("Jun 15", "3:00 PM"), stadium: "Lumen Field, Seattle", stage: "Group Stage", matchday: 1, group: "Group G", status: "scheduled" },
  { homeTeam: "Iran", awayTeam: "New Zealand", homeFlag: F.iran, awayFlag: F.newZealand, matchDate: et("Jun 15", "9:00 PM"), stadium: "SoFi Stadium, Los Angeles", stage: "Group Stage", matchday: 1, group: "Group G", status: "scheduled" },
  { homeTeam: "Belgium", awayTeam: "Iran", homeFlag: F.belgium, awayFlag: F.iran, matchDate: et("Jun 21", "3:00 PM"), stadium: "SoFi Stadium, Los Angeles", stage: "Group Stage", matchday: 2, group: "Group G", status: "scheduled" },
  { homeTeam: "New Zealand", awayTeam: "Egypt", homeFlag: F.newZealand, awayFlag: F.egypt, matchDate: et("Jun 21", "9:00 PM"), stadium: "BC Place, Vancouver", stage: "Group Stage", matchday: 2, group: "Group G", status: "scheduled" },
  { homeTeam: "Egypt", awayTeam: "Iran", homeFlag: F.egypt, awayFlag: F.iran, matchDate: et("Jun 26", "11:00 PM"), stadium: "Lumen Field, Seattle", stage: "Group Stage", matchday: 3, group: "Group G", status: "scheduled" },
  { homeTeam: "New Zealand", awayTeam: "Belgium", homeFlag: F.newZealand, awayFlag: F.belgium, matchDate: et("Jun 26", "11:00 PM"), stadium: "BC Place, Vancouver", stage: "Group Stage", matchday: 3, group: "Group G", status: "scheduled" },

  // ─── GROUP H: Spain, Cape Verde, Saudi Arabia, Uruguay ─────────────────
  { homeTeam: "Spain", awayTeam: "Cape Verde", homeFlag: F.spain, awayFlag: F.capeVerde, matchDate: et("Jun 15", "12:00 PM"), stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Group Stage", matchday: 1, group: "Group H", status: "scheduled" },
  { homeTeam: "Saudi Arabia", awayTeam: "Uruguay", homeFlag: F.saudiArabia, awayFlag: F.uruguay, matchDate: et("Jun 15", "6:00 PM"), stadium: "Hard Rock Stadium, Miami", stage: "Group Stage", matchday: 1, group: "Group H", status: "scheduled" },
  { homeTeam: "Spain", awayTeam: "Saudi Arabia", homeFlag: F.spain, awayFlag: F.saudiArabia, matchDate: et("Jun 21", "12:00 PM"), stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Group Stage", matchday: 2, group: "Group H", status: "scheduled" },
  { homeTeam: "Uruguay", awayTeam: "Cape Verde", homeFlag: F.uruguay, awayFlag: F.capeVerde, matchDate: et("Jun 21", "6:00 PM"), stadium: "Hard Rock Stadium, Miami", stage: "Group Stage", matchday: 2, group: "Group H", status: "scheduled" },
  { homeTeam: "Cape Verde", awayTeam: "Saudi Arabia", homeFlag: F.capeVerde, awayFlag: F.saudiArabia, matchDate: et("Jun 26", "8:00 PM"), stadium: "NRG Stadium, Houston", stage: "Group Stage", matchday: 3, group: "Group H", status: "scheduled" },
  { homeTeam: "Spain", awayTeam: "Uruguay", homeFlag: F.spain, awayFlag: F.uruguay, matchDate: et("Jun 26", "8:00 PM"), stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Group Stage", matchday: 3, group: "Group H", status: "scheduled" },

  // ─── GROUP I: France, Senegal, Iraq, Norway ────────────────────────────
  { homeTeam: "France", awayTeam: "Senegal", homeFlag: F.france, awayFlag: F.senegal, matchDate: et("Jun 16", "3:00 PM"), stadium: "MetLife Stadium, New York/NJ", stage: "Group Stage", matchday: 1, group: "Group I", status: "scheduled" },
  { homeTeam: "Iraq", awayTeam: "Norway", homeFlag: F.iraq, awayFlag: F.norway, matchDate: et("Jun 16", "6:00 PM"), stadium: "Gillette Stadium, Boston", stage: "Group Stage", matchday: 1, group: "Group I", status: "scheduled" },
  { homeTeam: "France", awayTeam: "Iraq", homeFlag: F.france, awayFlag: F.iraq, matchDate: et("Jun 22", "5:00 PM"), stadium: "Lincoln Financial Field, Philadelphia", stage: "Group Stage", matchday: 2, group: "Group I", status: "scheduled" },
  { homeTeam: "Norway", awayTeam: "Senegal", homeFlag: F.norway, awayFlag: F.senegal, matchDate: et("Jun 22", "8:00 PM"), stadium: "MetLife Stadium, New York/NJ", stage: "Group Stage", matchday: 2, group: "Group I", status: "scheduled" },
  { homeTeam: "Norway", awayTeam: "France", homeFlag: F.norway, awayFlag: F.france, matchDate: et("Jun 26", "3:00 PM"), stadium: "Gillette Stadium, Boston", stage: "Group Stage", matchday: 3, group: "Group I", status: "scheduled" },
  { homeTeam: "Senegal", awayTeam: "Iraq", homeFlag: F.senegal, awayFlag: F.iraq, matchDate: et("Jun 26", "3:00 PM"), stadium: "BMO Field, Toronto", stage: "Group Stage", matchday: 3, group: "Group I", status: "scheduled" },

  // ─── GROUP J: Argentina, Algeria, Austria, Jordan ─────────────────────
  { homeTeam: "Argentina", awayTeam: "Algeria", homeFlag: F.argentina, awayFlag: F.algeria, matchDate: et("Jun 16", "9:00 PM"), stadium: "Arrowhead Stadium, Kansas City", stage: "Group Stage", matchday: 1, group: "Group J", status: "scheduled" },
  { homeTeam: "Austria", awayTeam: "Jordan", homeFlag: F.austria, awayFlag: F.jordan, matchDate: et("Jun 16", "midnight"), stadium: "Levi's Stadium, San Francisco", stage: "Group Stage", matchday: 1, group: "Group J", status: "scheduled" },
  { homeTeam: "Argentina", awayTeam: "Austria", homeFlag: F.argentina, awayFlag: F.austria, matchDate: et("Jun 22", "1:00 PM"), stadium: "AT&T Stadium, Dallas", stage: "Group Stage", matchday: 2, group: "Group J", status: "scheduled" },
  { homeTeam: "Jordan", awayTeam: "Algeria", homeFlag: F.jordan, awayFlag: F.algeria, matchDate: et("Jun 22", "11:00 PM"), stadium: "Levi's Stadium, San Francisco", stage: "Group Stage", matchday: 2, group: "Group J", status: "scheduled" },
  { homeTeam: "Jordan", awayTeam: "Argentina", homeFlag: F.jordan, awayFlag: F.argentina, matchDate: et("Jun 27", "10:00 PM"), stadium: "AT&T Stadium, Dallas", stage: "Group Stage", matchday: 3, group: "Group J", status: "scheduled" },
  { homeTeam: "Algeria", awayTeam: "Austria", homeFlag: F.algeria, awayFlag: F.austria, matchDate: et("Jun 27", "10:00 PM"), stadium: "Arrowhead Stadium, Kansas City", stage: "Group Stage", matchday: 3, group: "Group J", status: "scheduled" },

  // ─── GROUP K: Portugal, DR Congo, Uzbekistan, Colombia ─────────────────
  { homeTeam: "Portugal", awayTeam: "DR Congo", homeFlag: F.portugal, awayFlag: F.drCongo, matchDate: et("Jun 17", "1:00 PM"), stadium: "NRG Stadium, Houston", stage: "Group Stage", matchday: 1, group: "Group K", status: "scheduled" },
  { homeTeam: "Uzbekistan", awayTeam: "Colombia", homeFlag: F.uzbekistan, awayFlag: F.colombia, matchDate: et("Jun 17", "10:00 PM"), stadium: "Estadio Azteca, Mexico City", stage: "Group Stage", matchday: 1, group: "Group K", status: "scheduled" },
  { homeTeam: "Portugal", awayTeam: "Uzbekistan", homeFlag: F.portugal, awayFlag: F.uzbekistan, matchDate: et("Jun 23", "1:00 PM"), stadium: "NRG Stadium, Houston", stage: "Group Stage", matchday: 2, group: "Group K", status: "scheduled" },
  { homeTeam: "Colombia", awayTeam: "DR Congo", homeFlag: F.colombia, awayFlag: F.drCongo, matchDate: et("Jun 23", "10:00 PM"), stadium: "Estadio Akron, Guadalajara", stage: "Group Stage", matchday: 2, group: "Group K", status: "scheduled" },
  { homeTeam: "Colombia", awayTeam: "Portugal", homeFlag: F.colombia, awayFlag: F.portugal, matchDate: et("Jun 27", "7:30 PM"), stadium: "Hard Rock Stadium, Miami", stage: "Group Stage", matchday: 3, group: "Group K", status: "scheduled" },
  { homeTeam: "DR Congo", awayTeam: "Uzbekistan", homeFlag: F.drCongo, awayFlag: F.uzbekistan, matchDate: et("Jun 27", "7:30 PM"), stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Group Stage", matchday: 3, group: "Group K", status: "scheduled" },

  // ─── GROUP L: England, Croatia, Ghana, Panama ──────────────────────────
  { homeTeam: "England", awayTeam: "Croatia", homeFlag: F.england, awayFlag: F.croatia, matchDate: et("Jun 17", "4:00 PM"), stadium: "AT&T Stadium, Dallas", stage: "Group Stage", matchday: 1, group: "Group L", status: "scheduled" },
  { homeTeam: "Ghana", awayTeam: "Panama", homeFlag: F.ghana, awayFlag: F.panama, matchDate: et("Jun 17", "7:00 PM"), stadium: "BMO Field, Toronto", stage: "Group Stage", matchday: 1, group: "Group L", status: "scheduled" },
  { homeTeam: "England", awayTeam: "Ghana", homeFlag: F.england, awayFlag: F.ghana, matchDate: et("Jun 23", "4:00 PM"), stadium: "Gillette Stadium, Boston", stage: "Group Stage", matchday: 2, group: "Group L", status: "scheduled" },
  { homeTeam: "Panama", awayTeam: "Croatia", homeFlag: F.panama, awayFlag: F.croatia, matchDate: et("Jun 23", "7:00 PM"), stadium: "BMO Field, Toronto", stage: "Group Stage", matchday: 2, group: "Group L", status: "scheduled" },
  { homeTeam: "Panama", awayTeam: "England", homeFlag: F.panama, awayFlag: F.england, matchDate: et("Jun 27", "5:00 PM"), stadium: "MetLife Stadium, New York/NJ", stage: "Group Stage", matchday: 3, group: "Group L", status: "scheduled" },
  { homeTeam: "Croatia", awayTeam: "Ghana", homeFlag: F.croatia, awayFlag: F.ghana, matchDate: et("Jun 27", "5:00 PM"), stadium: "Lincoln Financial Field, Philadelphia", stage: "Group Stage", matchday: 3, group: "Group L", status: "scheduled" },

  // ─── ROUND OF 32 (June 28 – July 3) ────────────────────────────────────
  { homeTeam: "TBD R32-1A", awayTeam: "TBD R32-1B", homeFlag: null, awayFlag: null, matchDate: "2026-06-28T04:00:00Z", stadium: "Levi's Stadium, San Francisco", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-2A", awayTeam: "TBD R32-2B", homeFlag: null, awayFlag: null, matchDate: "2026-06-28T17:00:00Z", stadium: "NRG Stadium, Houston", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-3A", awayTeam: "TBD R32-3B", homeFlag: null, awayFlag: null, matchDate: "2026-06-28T20:00:00Z", stadium: "AT&T Stadium, Dallas", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-4A", awayTeam: "TBD R32-4B", homeFlag: null, awayFlag: null, matchDate: "2026-06-28T23:00:00Z", stadium: "BMO Field, Toronto", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-5A", awayTeam: "TBD R32-5B", homeFlag: null, awayFlag: null, matchDate: "2026-06-29T02:00:00Z", stadium: "Estadio Azteca, Mexico City", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-6A", awayTeam: "TBD R32-6B", homeFlag: null, awayFlag: null, matchDate: "2026-06-29T19:00:00Z", stadium: "SoFi Stadium, Los Angeles", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-7A", awayTeam: "TBD R32-7B", homeFlag: null, awayFlag: null, matchDate: "2026-06-29T20:30:00Z", stadium: "Gillette Stadium, Boston", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-8A", awayTeam: "TBD R32-8B", homeFlag: null, awayFlag: null, matchDate: "2026-06-30T01:00:00Z", stadium: "Estadio BBVA, Monterrey", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-9A", awayTeam: "TBD R32-9B", homeFlag: null, awayFlag: null, matchDate: "2026-06-30T17:00:00Z", stadium: "AT&T Stadium, Dallas", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-10A", awayTeam: "TBD R32-10B", homeFlag: null, awayFlag: null, matchDate: "2026-06-30T21:00:00Z", stadium: "MetLife Stadium, New York/NJ", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-11A", awayTeam: "TBD R32-11B", homeFlag: null, awayFlag: null, matchDate: "2026-07-01T01:00:00Z", stadium: "Estadio Azteca, Mexico City", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-12A", awayTeam: "TBD R32-12B", homeFlag: null, awayFlag: null, matchDate: "2026-07-01T16:00:00Z", stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-13A", awayTeam: "TBD R32-13B", homeFlag: null, awayFlag: null, matchDate: "2026-07-01T20:00:00Z", stadium: "Lumen Field, Seattle", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-14A", awayTeam: "TBD R32-14B", homeFlag: null, awayFlag: null, matchDate: "2026-07-02T00:00:00Z", stadium: "Levi's Stadium, San Francisco", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-15A", awayTeam: "TBD R32-15B", homeFlag: null, awayFlag: null, matchDate: "2026-07-02T19:00:00Z", stadium: "SoFi Stadium, Los Angeles", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R32-16A", awayTeam: "TBD R32-16B", homeFlag: null, awayFlag: null, matchDate: "2026-07-02T23:00:00Z", stadium: "BMO Field, Toronto", stage: "Round of 32", matchday: 1, group: null, status: "scheduled" },

  // ─── ROUND OF 16 (July 4 – July 7) ─────────────────────────────────────
  { homeTeam: "TBD R16-1A", awayTeam: "TBD R16-1B", homeFlag: null, awayFlag: null, matchDate: "2026-07-04T17:00:00Z", stadium: "MetLife Stadium, New York/NJ", stage: "Round of 16", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R16-2A", awayTeam: "TBD R16-2B", homeFlag: null, awayFlag: null, matchDate: "2026-07-04T21:00:00Z", stadium: "SoFi Stadium, Los Angeles", stage: "Round of 16", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R16-3A", awayTeam: "TBD R16-3B", homeFlag: null, awayFlag: null, matchDate: "2026-07-05T17:00:00Z", stadium: "AT&T Stadium, Dallas", stage: "Round of 16", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R16-4A", awayTeam: "TBD R16-4B", homeFlag: null, awayFlag: null, matchDate: "2026-07-05T21:00:00Z", stadium: "NRG Stadium, Houston", stage: "Round of 16", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R16-5A", awayTeam: "TBD R16-5B", homeFlag: null, awayFlag: null, matchDate: "2026-07-06T17:00:00Z", stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Round of 16", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R16-6A", awayTeam: "TBD R16-6B", homeFlag: null, awayFlag: null, matchDate: "2026-07-06T21:00:00Z", stadium: "Levi's Stadium, San Francisco", stage: "Round of 16", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R16-7A", awayTeam: "TBD R16-7B", homeFlag: null, awayFlag: null, matchDate: "2026-07-07T17:00:00Z", stadium: "Gillette Stadium, Boston", stage: "Round of 16", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD R16-8A", awayTeam: "TBD R16-8B", homeFlag: null, awayFlag: null, matchDate: "2026-07-07T21:00:00Z", stadium: "Lumen Field, Seattle", stage: "Round of 16", matchday: 1, group: null, status: "scheduled" },

  // ─── QUARTERFINALS (July 9 – July 11) ──────────────────────────────────
  { homeTeam: "TBD QF-1A", awayTeam: "TBD QF-1B", homeFlag: null, awayFlag: null, matchDate: "2026-07-09T20:00:00Z", stadium: "MetLife Stadium, New York/NJ", stage: "Quarterfinals", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD QF-2A", awayTeam: "TBD QF-2B", homeFlag: null, awayFlag: null, matchDate: "2026-07-10T20:00:00Z", stadium: "SoFi Stadium, Los Angeles", stage: "Quarterfinals", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD QF-3A", awayTeam: "TBD QF-3B", homeFlag: null, awayFlag: null, matchDate: "2026-07-11T17:00:00Z", stadium: "AT&T Stadium, Dallas", stage: "Quarterfinals", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD QF-4A", awayTeam: "TBD QF-4B", homeFlag: null, awayFlag: null, matchDate: "2026-07-11T21:00:00Z", stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Quarterfinals", matchday: 1, group: null, status: "scheduled" },

  // ─── SEMIFINALS (July 14 – July 15) ─────────────────────────────────────
  { homeTeam: "TBD SF-1A", awayTeam: "TBD SF-1B", homeFlag: null, awayFlag: null, matchDate: "2026-07-14T20:00:00Z", stadium: "AT&T Stadium, Dallas", stage: "Semifinals", matchday: 1, group: null, status: "scheduled" },
  { homeTeam: "TBD SF-2A", awayTeam: "TBD SF-2B", homeFlag: null, awayFlag: null, matchDate: "2026-07-15T20:00:00Z", stadium: "Mercedes-Benz Stadium, Atlanta", stage: "Semifinals", matchday: 1, group: null, status: "scheduled" },

  // ─── THIRD PLACE MATCH (July 18) ────────────────────────────────────────
  { homeTeam: "TBD 3P-1", awayTeam: "TBD 3P-2", homeFlag: null, awayFlag: null, matchDate: "2026-07-18T19:00:00Z", stadium: "Hard Rock Stadium, Miami", stage: "Third Place", matchday: 1, group: null, status: "scheduled" },

  // ─── FINAL (July 19) ────────────────────────────────────────────────────
  { homeTeam: "TBD Final-1", awayTeam: "TBD Final-2", homeFlag: null, awayFlag: null, matchDate: "2026-07-19T19:00:00Z", stadium: "MetLife Stadium, New York/NJ", stage: "Final", matchday: 1, group: null, status: "scheduled" },
];

async function main() {
  console.log(`Seeding ${fixtures.length} official FIFA World Cup 2026 matches...`);

  await db.delete(matches);
  await db.insert(matches).values(fixtures.map(f => ({ ...f, matchDate: new Date(f.matchDate) })));

  console.log(`Done. Inserted ${fixtures.length} matches.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
