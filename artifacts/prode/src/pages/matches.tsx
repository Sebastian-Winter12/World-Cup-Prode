import { useState, useEffect } from "react";
import { useListMatches } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { MatchCard } from "@/components/match-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { translations } from "@/i18n/translations"; // ajustá el path
import { useI18n } from "@/i18n/context";
import { useDebounce } from "@/hooks/use-debounce";
import { customFetch } from "@workspace/api-client-react";

export default function Matches() {
  const { t } = useI18n();
  const [stage, setStage] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const { lang } = useI18n();

  function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function translateToEnglish(query: string): string {
  const teamTranslations = translations[lang].teams;
  const entry = Object.entries(teamTranslations).find(([_en, translated]) =>
    normalize(translated).includes(normalize(query))
  );
  return entry ? entry[0] : query;
}
  const debouncedSearch = useDebounce(search, 400);

  const { data: matches, isLoading } = useListMatches({
    stage: stage !== "all" ? stage : undefined,
    status: status !== "all" ? status : undefined,
  }, {
    query: { refetchInterval: 60000 } as any
  });

  useEffect(() => {
  if (!debouncedSearch.trim()) {
    setSearchResults(null);
    return;
  }
  
  setSearchLoading(true);
  const englishQuery = translateToEnglish(debouncedSearch);
  customFetch<any[]>(`/api/matches/search?q=${encodeURIComponent(englishQuery)}`)
    .then(data => setSearchResults(data))
    .catch(() => setSearchResults([]))
    .finally(() => setSearchLoading(false));
}, [debouncedSearch]);

  const displayMatches = searchResults ?? matches;
  const loading = searchResults ? searchLoading : isLoading;

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {t.matches.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t.matches.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t.matches.filterStage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.matches.allStages}</SelectItem>
              <SelectItem value="Group Stage">{t.matches.groupStage}</SelectItem>
              <SelectItem value="Round of 32">{t.matches.roundOf32}</SelectItem>
              <SelectItem value="Round of 16">{t.matches.roundOf16}</SelectItem>
              <SelectItem value="Quarterfinals">{t.matches.quarterFinals}</SelectItem>
              <SelectItem value="Semifinals">{t.matches.semiFinals}</SelectItem>
              <SelectItem value="Third Place">{t.matches.thirdPlace}</SelectItem>
              <SelectItem value="Final">{t.matches.final}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t.matches.filterStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.matches.allStatuses}</SelectItem>
              <SelectItem value="scheduled">{t.matches.scheduled}</SelectItem>
              <SelectItem value="live">{t.matches.live}</SelectItem>
              <SelectItem value="finished">{t.matches.finished}</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Buscar país..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-[200px]"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : displayMatches && displayMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
            {t.matches.noMatches}
          </div>
        )}
      </div>
    </Layout>
  );
}