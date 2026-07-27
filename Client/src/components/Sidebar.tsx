import logo from "../assets/hero.png";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Users,
} from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
};

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="size-5" />,
      path: "/dashboard",
    },
    {
      name: "Accounts",
      icon: <Users className="size-5" />,
      path: "/accounts",
    },
    {
      name: "Schedule",
      icon: <CalendarDays className="size-5" />,
      path: "/schedule",
    },
    {
      name: "AI Composer",
      icon: <Sparkles className="size-5" />,
      path: "/ai-composer",
    },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="size-7" />
          <h1 className="text-xl font-bold text-slate-800">
            Scheduler
          </h1>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              location.pathname === item.path
                ? "bg-blue-100 text-blue-600"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      // footer 
    </div>
  );
};

export default Sidebar;