'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { ChevronRight, Globe, Layers, Search, Filter, ChevronDown, Check } from 'lucide-react';

export default function JudgeDashboard() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);

  useEffect(() => {
    // Ideally fetch assigned programs, but for MVP fetching all
    const fetchPrograms = async () => {
      try {
        const data = await apiRequest('/programs');
        setPrograms(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPrograms();
  }, []);

  // Derived filters
  const languages = Array.from(new Set(programs.map(p => p.language).filter(Boolean)));
  const groups = Array.from(new Set(programs.map(p => p.groupId?.name).filter(Boolean)));

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLanguage ? p.language === selectedLanguage : true;
    const matchesGroup = selectedGroup ? p.groupId?.name === selectedGroup : true;
    return matchesSearch && matchesLang && matchesGroup;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Select Program to Judge</h2>
      </div>

      {/* Filters & Search - Modernized */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#1E1B2E] p-1.5 rounded-2xl border border-[#2D283E] shadow-xl shadow-purple-900/10">
        <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
            </div>
            <input 
                type="text" 
                placeholder="Search programs..." 
                className="block w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex gap-2">
            {/* Language Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => { setIsLangOpen(!isLangOpen); setIsGroupOpen(false); }}
                    className="flex items-center gap-2 bg-[#13111C] hover:bg-[#1A1825] border border-gray-800 hover:border-gray-700 rounded-xl pl-3 pr-4 py-3 text-sm text-gray-300 focus:outline-none transition-all w-48 justify-between"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Globe size={14} className="text-gray-500 shrink-0" />
                        <span className="truncate">{selectedLanguage || 'All Languages'}</span>
                    </div>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isLangOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                        <div className="absolute top-full mt-2 right-0 w-56 bg-[#0f0e17] border border-gray-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                             <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                <button 
                                    onClick={() => { setSelectedLanguage(''); setIsLangOpen(false); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedLanguage === '' ? 'bg-purple-600/10 text-purple-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <span>All Languages</span>
                                    {selectedLanguage === '' && <Check size={14} />}
                                </button>
                                {languages.map((l: any) => (
                                    <button 
                                        key={l}
                                        onClick={() => { setSelectedLanguage(l); setIsLangOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedLanguage === l ? 'bg-purple-600/10 text-purple-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                    >
                                        <span>{l}</span>
                                        {selectedLanguage === l && <Check size={14} />}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </>
                )}
            </div>

            {/* Group Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => { setIsGroupOpen(!isGroupOpen); setIsLangOpen(false); }}
                    className="flex items-center gap-2 bg-[#13111C] hover:bg-[#1A1825] border border-gray-800 hover:border-gray-700 rounded-xl pl-3 pr-4 py-3 text-sm text-gray-300 focus:outline-none transition-all w-48 justify-between"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Layers size={14} className="text-gray-500 shrink-0" />
                         <span className="truncate">{selectedGroup || 'All Groups'}</span>
                    </div>
                   <ChevronDown size={14} className={`text-gray-500 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`} />
                </button>

                 {/* Dropdown Menu */}
                {isGroupOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsGroupOpen(false)}></div>
                        <div className="absolute top-full mt-2 right-0 w-56 bg-[#0f0e17] border border-gray-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                             <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                <button 
                                    onClick={() => { setSelectedGroup(''); setIsGroupOpen(false); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedGroup === '' ? 'bg-purple-600/10 text-purple-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <span>All Groups</span>
                                    {selectedGroup === '' && <Check size={14} />}
                                </button>
                                {groups.map((g: any) => (
                                    <button 
                                        key={g}
                                        onClick={() => { setSelectedGroup(g); setIsGroupOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedGroup === g ? 'bg-purple-600/10 text-purple-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                    >
                                        <span>{g}</span>
                                        {selectedGroup === g && <Check size={14} />}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrograms.map((program) => (
          <Link 
            key={program._id} 
            href={`/judge/program/${program._id}`}
            className="group relative overflow-hidden bg-[#1E1B2E] rounded-2xl border border-[#2D283E] hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20"
          >
            {/* Background Gradient Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/0 via-purple-900/0 to-purple-900/0 group-hover:via-purple-900/10 group-hover:to-purple-900/20 transition-all duration-500" />
            
            <div className="relative p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-[#13111C] border border-[#2D283E] group-hover:border-purple-500/30 group-hover:scale-110 transition-all duration-300">
                        <Layers size={20} className="text-purple-400" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-[#13111C] px-2 py-1 rounded-lg border border-[#2D283E]">
                        <span>MAX</span>
                        <span className="text-white">{program.maxMarks}</span>
                    </div>
                </div>

                <div className="mb-4 flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                        {program.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {program.language && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/5 text-blue-400 border border-blue-500/10 text-[10px] font-bold uppercase tracking-wider">
                                <Globe size={10} /> {program.language}
                            </span>
                        )}
                        {program.groupId && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 text-[10px] font-bold uppercase tracking-wider">
                                <Layers size={10} /> {program.groupId.name || 'Group'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#2D283E] mt-auto">
                    <span className="text-xs text-gray-400 font-medium group-hover:text-gray-300 transition-colors">
                        Tap to Evaluate
                    </span>
                    <div className="p-1.5 rounded-full bg-white/5 text-gray-400 group-hover:bg-purple-500 group-hover:text-white transition-all transform group-hover:-rotate-45">
                        <ChevronRight size={16} />
                    </div>
                </div>
            </div>
          </Link>
        ))}
        {filteredPrograms.length === 0 && (
            <div className="col-span-full text-center py-16 bg-[#1E1B2E] rounded-3xl border border-dashed border-[#2D283E]">
                <div className="w-16 h-16 bg-[#13111C] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#2D283E] text-gray-600">
                    <Search size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No programs found</h3>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                    We couldn't find any programs matching your current filters.
                </p>
                <button 
                    onClick={() => {setSearchTerm(''); setSelectedLanguage(''); setSelectedGroup('');}}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors font-medium text-sm"
                >
                    Clear All Filters
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
