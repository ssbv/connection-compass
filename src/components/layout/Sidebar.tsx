import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Home, TrendingUp, Compass, Heart, GitCompare, Users, Settings, LogOut, LogIn } from "lucide-react";

const mainNavItems = [
  { id: "home", label: "Home", path: "/dashboard", icon: Home },
  { id: "patterns", label: "Pattern Tracker", path: "/patterns", icon: TrendingUp },
  { id: "projections", label: "Future Projection", path: "/projections", icon: Compass },
  { id: "emotional", label: "Emotional Growth", path: "/emotional-growth", icon: Heart },
  { id: "compare", label: "Compare", path: "/compare", icon: GitCompare },
];

const bottomItems = [
  { id: "connections", label: "Connections", path: "/connections", icon: Users },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/dashboard");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed top-0 left-0 h-screen w-52 z-40 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-4 pt-6">
        <span className="text-sm font-semibold text-sidebar-foreground tracking-wide">
          Connection Compass
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent rounded-md transition-colors",
                    isActive(item.path) && "bg-sidebar-accent text-sidebar-primary font-medium"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="my-6 border-t border-sidebar-border" />

        <ul className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent rounded-md transition-colors",
                    isActive(item.path) && "bg-sidebar-accent text-sidebar-primary font-medium"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Login/Logout */}
      <div className="p-3 pb-6">
        {user && (
          <p className="text-xs text-sidebar-foreground/60 mb-2 px-3 truncate">
            {user.email}
          </p>
        )}
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        ) : (
          <Link
            to="/auth"
            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent rounded-md transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Log In
          </Link>
        )}
      </div>
    </aside>
  );
}
