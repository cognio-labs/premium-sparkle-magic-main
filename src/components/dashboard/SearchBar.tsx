import { Search, X } from "lucide-react";

export const SearchBar = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="relative w-full max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search apps & templates..."
      className="w-full h-9 pl-9 pr-9 rounded-xl bg-card/80 backdrop-blur-xl border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-soft"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground"
        aria-label="Clear search"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);
