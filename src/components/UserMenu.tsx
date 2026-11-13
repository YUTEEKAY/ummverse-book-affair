import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function userDisplay(user: any) {
  const m = user?.user_metadata ?? {};
  const name: string = m.full_name || m.name || user?.email?.split("@")[0] || "Reader";
  const avatar: string | undefined = m.avatar_url || m.picture;
  const initials = name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();
  return { name, avatar, initials };
}

export function UserMenu({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Button asChild size="sm" variant={tone === "light" ? "secondary" : "default"} className="normal-case tracking-normal">
        <Link to="/signin">Sign In</Link>
      </Button>
    );
  }
  const { name, avatar, initials } = userDisplay(user);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full normal-case tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-8 w-8">
          {avatar && <AvatarImage src={avatar} alt="" referrerPolicy="no-referrer" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[160px] truncate text-sm sm:inline">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />My dashboard</Link></DropdownMenuItem>
        {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><Shield className="mr-2 h-4 w-4" />Admin</Link></DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
