'use client';

import { useEffect, useState, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { FileDown, RefreshCw, Search, Trophy, CheckCircle, Clock, ChevronDown, Check, Filter } from 'lucide-react';

export default function MarksReviewPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedProgramData, setSelectedProgramData] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dropdown & Filter state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterLang, setSelectedFilterLang] = useState('All');

  useEffect(() => {
    apiRequest('/programs').then(setPrograms).catch(console.error);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProgramSelect = async (program: any) => {
    setSelectedProgram(program._id);
    setSelectedProgramData(program);
    setIsDropdownOpen(false);
    
    if(!program._id) {
        setMarks([]);
        return;
    }
    setLoading(true);
    try {
      const data = await apiRequest(`/marks/${program._id}`);
      setMarks(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCalculate = async () => {
    if (!confirm('This will recalculate scores for all teams based on these marks. Continue?')) return;
    try {
       await apiRequest(`/marks/calculate/${selectedProgram}`, 'POST');
       alert('Scores Recalculated and Leaderboard Updated!');
    } catch(e: any) {
        alert(e.message);
    }
  };

  const downloadCSV = () => {
     if (!marks.length) return;
     const headers = "Participant,Chest No,Team,Judge,Marks,Status";
     const rows = marks.map(m => 
        `"${m.participantId?.name || ''}","${m.participantId?.chestNumber || ''}","${m.participantId?.teamId?.name || ''}","${m.judgeId?.name || ''}",${m.marksGiven},Submitted`
     ).join('\n');
     
     const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `marks_export_${selectedProgram}.csv`);
     document.body.appendChild(link);
     link.click();
  };

  const getLangColor = (lang: string) => {
      switch(lang?.toLowerCase()) {
          case 'arabic': return 'bg-green-500/10 text-green-400 border-green-500/20';
          case 'english': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          case 'malayalam': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
          case 'urdu': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
          default: return 'bg-gray-700 text-gray-300 border-gray-600';
      }
  };

  const filteredPrograms = programs.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLang = selectedFilterLang === 'All' || p.language === selectedFilterLang;
      return matchesSearch && matchesLang;
  });

  const languages = ['All', ...Array.from(new Set(programs.map(p => p.language))).filter(Boolean)];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
        {/* Header */}
        <div>
           <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Review Marks & Reports</h2>
           <p className="text-gray-400 mt-1">Verify judge submissions and publish final scores.</p>
        </div>
        
        {/* Controls Section */}
        <div className="bg-[#1E1B2E] p-6 rounded-2xl border border-[#2D283E] shadow-xl flex flex-col gap-6">
            
            {/* Language Filter Pills */}
            <div className="flex gap-2 p-1 bg-[#13111C] rounded-xl border border-gray-800 w-fit">
                {languages.map(lang => (
                    <button
                        key={lang}
                        onClick={() => { setSelectedFilterLang(lang); setIsDropdownOpen(true); }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedFilterLang === lang 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-end md:items-center justify-between">
                <div className="w-full md:w-1/3 space-y-2 relative" ref={dropdownRef}>
                    <label className="text-sm font-medium text-gray-400 pl-1">Select Program</label>
                    
                    {/* Trigger */}
                    <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full pl-4 pr-10 py-3 bg-[#13111C] border border-gray-700 rounded-xl text-white cursor-pointer hover:bg-gray-900 transition-all flex items-center justify-between group"
                    >
                        {selectedProgramData ? (
                            <div className="flex items-center gap-3">
                                <span className="font-medium">{selectedProgramData.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getLangColor(selectedProgramData.language)}`}>
                                    {selectedProgramData.language}
                                </span>
                            </div>
                        ) : (
                            <span className="text-gray-500">Choose a program...</span>
                        )}
                        <ChevronDown className={`absolute right-4 text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                    </div>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute top-[110%] left-0 w-full bg-[#13111C] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-2 border-b border-gray-800">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                    <input 
                                        className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                        placeholder={`Search ${selectedFilterLang !== 'All' ? selectedFilterLang : ''} programs...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                {filteredPrograms.length > 0 ? (
                                    filteredPrograms.map(p => (
                                        <div 
                                            key={p._id} 
                                            onClick={() => handleProgramSelect(p)}
                                            className={`
                                                flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                                                ${selectedProgram === p._id ? 'bg-purple-600/10 border border-purple-600/20' : 'hover:bg-gray-800'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm ${selectedProgram === p._id ? 'text-purple-300 font-bold' : 'text-gray-300'}`}>
                                                    {p.name}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getLangColor(p.language)}`}>
                                                    {p.language}
                                                </span>
                                            </div>
                                            {selectedProgram === p._id && <Check size={14} className="text-purple-400" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No {selectedFilterLang !== 'All' ? selectedFilterLang : ''} programs found
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <button 
                        onClick={handleCalculate}
                        disabled={!selectedProgram}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-900/20 active:scale-95"
                    >
                        <Trophy size={18} />
                        Verify
                    </button> 

                    <button
                        onClick={downloadCSV}
                        disabled={!marks.length}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#2D283E] hover:bg-[#352F4B] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all border border-gray-700 hover:border-gray-600 active:scale-95"
                    >
                        <FileDown size={18} />
                        Export
                    </button>
                </div>
            </div>
        </div>

        {/* Data Table */}
        {selectedProgram && (
            <div className="bg-[#1E1B2E] rounded-2xl overflow-hidden border border-[#2D283E] shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#1A1825] border-b border-[#2D283E]">
                            <tr>
                                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-500">Participant</th>
                                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Marks Given</th>
                                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-500">Judge</th>
                                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D283E]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 text-purple-400 animate-pulse">
                                            <RefreshCw size={32} className="animate-spin" />
                                            <span className="font-medium">Loading marks...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : marks.length > 0 ? (
                                marks.map(m => (
                                    <tr key={m._id} className="hover:bg-[#252236] transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#13111C] border border-gray-700 flex items-center justify-center text-sm font-bold text-gray-400 font-mono">
                                                    {m.participantId?.chestNumber}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-purple-300 transition-colors">{m.participantId?.name}</div>
                                                    <div className="text-xs text-gray-500">{m.participantId?.teamId?.name || 'No Team'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className="inline-block px-4 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-mono text-lg font-bold">
                                                {m.marksGiven}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px]">
                                                    {m.judgeId?.name?.charAt(0)}
                                                </div>
                                                {m.judgeId?.name}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                                                <CheckCircle size={12} />
                                                Submitted
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Clock size={32} className="opacity-20" />
                                            <p>No marks submitted for this program yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}
