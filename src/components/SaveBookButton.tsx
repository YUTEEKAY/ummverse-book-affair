import { useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSavedBooks } from "@/hooks/useSavedBooks";
import { cn } from "@/lib/utils";

export function SaveBookButton({ bookId, title, className, heart = false }: { bookId: string; title?: string; className?: string; heart?: boolean }) {
  const { ids, toggle } = useSavedBooks();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const saved = ids.has(bookId);
  const Icon = heart ? Heart : Bookmark;

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      const res = await toggle(bookId);
      if ("needsSignIn" in res) {
        toast("Sign in to save books", { action: { label: "Sign in", onClick: () => navigate("/signin") } });
      } else {
        toast.success(res.saved ? `Saved${title ? ` "${title}"` : ""} to your reading list` : "Removed from your reading list");
      }
    } catch {
      toast.error("Couldn't update your reading list. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="icon" variant="secondary"
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from reading list" : "Save to reading list"}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-60",
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", saved && "fill-primary text-primary")} />
    </Button>
  );
}
