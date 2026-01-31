'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, LayoutGrid, Award, Calendar, FileText, LogOut, CheckSquare } from 'lucide-react';

import { AdminProvider } from './AdminContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Basic Client-side Auth Check
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!authorized) return <div className="text-white p-10">Checking authorization...</div>;

  return (
    <AdminProvider>
      <div className="flex min-h-screen bg-gray-950 text-white font-sans">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-800 bg-gray-900/50 backdrop-blur-xl flex flex-col fixed h-full z-10">
          <div className="p-6 border-b border-gray-800">
             <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Admin Panel
            </h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            <NavLink href="/admin/dashboard" icon={<LayoutGrid size={20}/>}>Dashboard</NavLink>
            <NavLink href="/admin/participants" icon={<Users size={20}/>}>Participants</NavLink>
            <NavLink href="/admin/teams" icon={<Users size={20}/>}>Teams</NavLink>
            <NavLink href="/admin/groups" icon={<Users size={20}/>}>Groups</NavLink>
            <NavLink href="/admin/programs" icon={<Calendar size={20}/>}>Programs</NavLink>
            <NavLink href="/admin/judges" icon={<Users size={20}/>}>Judges</NavLink>
            <NavLink href="/admin/marks" icon={<CheckSquare size={20}/>}>Review Marks</NavLink>
            <NavLink href="/admin/export" icon={<FileText size={20}/>}>Reports & Export</NavLink>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 w-full p-3 rounded hover:bg-red-500/10 hover:text-red-400 transition text-gray-400"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </AdminProvider>
  );
}

import { usePathname } from 'next/navigation';

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href} 
      className={`relative flex items-center gap-3 p-3.5 mx-2 rounded-xl transition-all duration-300 group overflow-hidden ${
        isActive 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-900/40 translate-x-1' 
          : 'text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
      }`}
    >
        {/* Active Indicator Glow */}
        {isActive && (
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        
      <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="font-medium tracking-wide text-sm">{children}</span>
      
      {/* Right chevron for active state */}
      {isActive && (
         <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      )}
    </Link>
  );
}
