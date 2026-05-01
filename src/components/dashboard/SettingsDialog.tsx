import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getEndpoint, setEndpoint } from "@/lib/store";

export const SettingsDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [url, setUrl] = useState("");

  useEffect(() => { if (open) setUrl(getEndpoint()); }, [open]);

  if (!open) return null;

  const save = () => {
    setEndpoint(url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-popover border border-border shadow-elegant p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl">Generation endpoint</h2>
            <p className="text-xs text-muted-foreground mt-1">Configure the API used to generate previews.</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="text-xs font-medium text-muted-foreground">API URL</label>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://your-api.com/generate"
          className="mt-1.5 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground mt-2">
          POST <code className="text-foreground">{`{ prompt }`}</code> → expects <code className="text-foreground">{`{ name, preview, tags }`}</code>. Leave empty to use a built-in mock.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
          <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-elegant transition-shadow">Save</button>
        </div>
      </div>
    </div>
  );
};
