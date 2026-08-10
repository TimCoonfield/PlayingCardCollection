export const ARCHIVE_SEARCH_SCOPES = [
  "all",
  "name",
  "creator",
  "series",
  "producer",
  "notes",
] as const;

export type ArchiveSearchScope = (typeof ARCHIVE_SEARCH_SCOPES)[number];

export function isArchiveSearchScope(value: string): value is ArchiveSearchScope {
  return ARCHIVE_SEARCH_SCOPES.includes(value as ArchiveSearchScope);
}

export const ARCHIVE_SEARCH_SCOPE_LABELS: Record<ArchiveSearchScope, string> = {
  all: "All",
  name: "Deck Name",
  creator: "Creator",
  series: "Series",
  producer: "Producer",
  notes: "Notes",
};
