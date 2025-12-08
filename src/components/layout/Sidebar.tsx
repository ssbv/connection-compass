import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "snapshots", label: "Snapshots", section: "snapshots" },
  { id: "overall-results", label: "Overall Results", section: "overall-results" },
  { id: "them-you", label: "Them & You", section: "them-you" },
  { id: "dynamics", label: "Dynamics", section: "dynamics" },
];

const bottomItems = [
  { id: "connections", label: "Connections", path: "/connections" },
  { id: "settings", label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleNavClick = (item: typeof navItems[0]) => {
    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
    }
    // Scroll to section after a small delay to ensure page is loaded
    setTimeout(() => {
      const element = document.getElementById(item.section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleBottomClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 z-40 bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-4 pt-6">
        <span className="text-sm font-semibold text-sidebar-foreground tracking-wide">
          LOGO
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavClick(item)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent rounded-md transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="my-6 border-t border-sidebar-border" />

        <ul className="space-y-1">
          {bottomItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleBottomClick(item.path)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent rounded-md transition-colors",
                  location.pathname === item.path && "bg-sidebar-accent text-sidebar-primary font-medium"
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout at bottom */}
      <div className="p-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent rounded-md transition-colors"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
