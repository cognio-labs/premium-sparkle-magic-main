import { useState, useRef, useEffect } from "react";
import { User, Settings, Languages, HelpCircle, Heart, UserPlus, Gift, LogOut, ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export const ProfileMenu = ({ name, email, onLogout }: { name: string; email: string; onLogout: () => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const initial = (name || email || "A").slice(0, 1).toUpperCase();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center shadow-soft hover:shadow-elegant transition-shadow"
        aria-label="Profile menu"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-popover/95 backdrop-blur-xl border border-border shadow-elegant overflow-hidden animate-fade-in z-50">
          <div className="p-4 flex items-center gap-3 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground font-semibold flex items-center justify-center">{initial}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{name || "Aariyan Malik"}</p>
              <p className="text-xs text-muted-foreground truncate">{email || "aariyanmalik61@gmail.com"}</p>
            </div>
          </div>

          <div className="p-1.5">
            <Item icon={User} label="View profile" />
            <Item icon={Settings} label="Account settings" />
            <Item icon={Languages} label="Language" arrow />
            <Item icon={HelpCircle} label="Help & support" />
          </div>

          <div className="p-1.5 border-t border-border">
            <button onClick={toggle} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/60 text-popover-foreground transition-colors">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="flex-1 text-left">{theme === "light" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>

          <div className="p-1.5 border-t border-border">
            <Item icon={Heart} label="Become an affiliate" />
            <Item icon={UserPlus} label="Refer a friend" />
            <Item icon={Gift} label="Send a gift card" />
          </div>

          <div className="p-1.5 border-t border-border">
            <Item icon={LogOut} label="Log out" onClick={onLogout} />
          </div>
        </div>
      )}
    </div>
  );
};

const Item = ({ icon: Icon, label, arrow, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/60 text-popover-foreground transition-colors">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <span className="flex-1 text-left">{label}</span>
    {arrow && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
  </button>
);
