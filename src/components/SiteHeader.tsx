import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
        >
          <Heart className="h-4 w-4 text-primary" /> Ummverse
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}

export default SiteHeader;
