import { Link } from "react-router-dom";
import { Layout, LogOut, ShieldCheck } from "lucide-react";

interface NavbarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  onAdminClick: () => void;
}

export default function Navbar({ isAuthenticated, onLogout, onAdminClick }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white group-hover:bg-stone-800 transition-colors">
            <Layout size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">ResearchHub</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
          >
            Submissions
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link 
                to="/admin/dashboard" 
                className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium transition-colors"
              >
                <ShieldCheck size={18} />
                Dashboard
              </Link>
              <button 
                onClick={onLogout}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={onAdminClick}
              className="text-stone-400 hover:text-stone-600 transition-colors font-medium"
            >
              Admin
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
