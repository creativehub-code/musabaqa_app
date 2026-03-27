'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, LayoutGrid, Award, Calendar, FileText, LogOut, CheckSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { AdminProvider } from './AdminContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      <div className="flex min-h-screen bg-gray-950 text-white font-sans pb-20 md:pb-0 overflow-x-hidden">
        
        {/* Toggle Button explicitly when closed */}
        <div className={`hidden md:flex fixed top-6 left-6 z-40 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-gray-900/80 border border-gray-800 rounded-lg text-gray-400 hover:text-white backdrop-blur-xl transition hover:bg-gray-800 shadow-lg"
          >
            <PanelLeftOpen size={24} />
          </button>
        </div>

        {/* Sidebar - Hidden on Mobile, togglable on desktop */}
        <aside className={`hidden md:flex w-64 border-r border-gray-800 bg-gray-900/50 backdrop-blur-xl flex-col fixed h-full z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 flex items-center justify-between border-b border-gray-800">
             <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Admin Panel
            </h2>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="text-gray-400 hover:text-white transition p-1 hover:bg-white/10 rounded-md"
            >
              <PanelLeftClose size={24} />
            </button>
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

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F0D15]/90 backdrop-blur-xl border-t border-gray-800 z-50 px-6 py-4 flex justify-between items-center pb-safe">
            <MobileNavLink href="/admin/dashboard" icon={<LayoutGrid size={24}/>} label="Dashboard" />
            <MobileNavLink href="/admin/teams" icon={<Users size={24}/>} label="Teams" />
            <div className="relative -top-8">
               <Link href="/admin/programs" className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/50 hover:scale-105 transition-transform">
                  <Calendar size={28} />
               </Link>
            </div>
             <MobileNavLink href="/admin/participants" icon={<Users size={24}/>} label="People" />
             <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-400">
                 <LogOut size={24} />
                 <span className="text-[10px] font-medium">Logout</span>
             </button>
        </div>

        {/* Main Content - Adjusted Margin */}
        <main className={`flex-1 transition-all duration-300 p-2 md:p-8 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          {children}
        </main>
      </div>
    </AdminProvider>
  );
}

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

function MobileNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;
  
    return (
      <Link href={href} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
          {icon}
          <span className="text-[10px] font-medium">{label}</span>
      </Link>
    );
  }
