'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { X, Trash2, Shield, Users, Trophy, Plus, ChevronRight } from 'lucide-react';
import { useAdminData } from '../AdminContext';

export default function TeamsPage() {
  const { teams, refreshTeams } = useAdminData();
  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [filterGroup, setFilterGroup] = useState('All');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/teams', 'POST', { name });
      refreshTeams();
      setName('');
    } catch(e) { alert('Error creating team'); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the details section
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await apiRequest(`/teams/${id}`, 'DELETE');
      refreshTeams();
      if (selectedTeam?._id === id) setSelectedTeam(null);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      
      {/* Header & Create Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Manage Teams</h2>
           <p className="text-gray-400 mt-1">Create teams and track their overall standing.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full md:w-auto p-1.5 bg-gray-900 border border-gray-800 rounded-xl flex shadow-lg">
            <div className="relative flex-1 md:w-64">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="New Team Name" 
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-white focus:outline-none placeholder:text-gray-600 font-medium" 
                    required 
                />
            </div>
            <button className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2">
                <Plus size={18} /> Add
            </button>
        </form>
      </div>

      {/* Modern Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {teams.map((t, index) => (
          <div 
            key={t._id} 
            onClick={async () => { 
              setSelectedTeam(t); // Show basic info immediately
              setFilterGroup('All');
              try {
                  const detailedTeam = await apiRequest(`/teams/${t._id}`);
                  setSelectedTeam(detailedTeam); // Update with full details
              } catch (e) {
                  console.error("Failed to load details", e);
              }
            }}
            className={`
                group relative bg-[#1E1B2E] rounded-xl p-4 border border-[#2D283E] 
                hover:border-purple-500/50 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1
                ${selectedTeam?._id === t._id ? 'ring-2 ring-purple-500 border-transparent bg-[#1E1B2E]/80' : ''}
            `}
          >
            {/* Background Gradient Blob */}
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-gray-700 font-bold text-lg text-white shadow-inner">
                        {t.name.charAt(0)}
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] text-gray-400 font-mono">
                        #{index + 1}
                    </div>
                </div>

                <div>
                    <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-purple-300 transition-colors truncate">{t.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users size={12} /> {t.participantIds?.length || 0}</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between mt-1">
                     <span className="flex items-center gap-1.5 text-purple-400 font-bold text-sm">
                        <Trophy size={14} className="text-purple-500" />
                        {t.totalScore}
                     </span>
                     
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                             onClick={(e) => handleDelete(e, t._id)}
                             className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                         >
                             <Trash2 size={14} />
                         </button>
                         <button className="p-1.5 text-gray-500 hover:text-white bg-gray-800 rounded-md">
                             <ChevronRight size={14} />
                         </button>
                     </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Team Details Section */}
      {selectedTeam && (
        <div className="mt-8 bg-[#1E1B2E] border border-[#2D283E] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="p-6 border-b border-[#2D283E] flex flex-col md:flex-row justify-between items-start md:items-center bg-[#13111C] gap-4">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-900/50">
                     {selectedTeam.name.charAt(0)}
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedTeam.name}</h2>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400 font-medium">{selectedTeam.participantIds?.length || 0} Members</span>
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <span className="text-purple-400 font-bold">{selectedTeam.totalScore} Points</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                {/* Modern Pills Filter */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                   {['All', 'Senior', 'Junior', 'SubJunior'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setFilterGroup(filter)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                           filterGroup === filter 
                           ? 'bg-purple-600 text-white shadow-lg' 
                           : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {filter}
                      </button>
                   ))}
                </div>

                <button 
                    onClick={() => setSelectedTeam(null)}
                    className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors border border-gray-700 hover:border-gray-600"
                >
                    <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-0">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1A1825]">
                      <tr className="border-b border-[#2D283E] text-gray-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="p-5 w-20">#</th>
                        <th className="p-5 w-32">Chest No</th>
                        <th className="p-5">Participant</th>
                        <th className="p-5 w-40">Group</th>
                        <th className="p-5 w-48">Programs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D283E]">
                      {selectedTeam.participantIds
                        ?.filter((p: any) => {
                            if (filterGroup === 'All') return true;
                            const gName = p?.groupId?.name || '';
                            return gName.trim().toLowerCase() === filterGroup.toLowerCase();
                        })
                        .map((p: any, index: number, arr: any[]) => (
                        <tr key={p._id} className="hover:bg-[#252236] transition-colors group">
                          <td className="p-5 text-gray-500 font-mono text-sm">{arr.length - index}</td>
                          <td className="p-5">
                             <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#13111C] border border-gray-700 text-purple-300 font-mono text-sm font-bold shadow-sm">
                                {p.chestNumber}
                             </div>
                          </td>
                          <td className="p-5">
                             <span className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">{p.name}</span>
                          </td>
                          <td className="p-5">
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                p.groupId?.name === 'Senior' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                p.groupId?.name === 'Junior' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                             }`}>
                                {p.groupId?.name || '-'}
                             </span>
                          </td>
                          <td className="p-5">
                             {p.programs?.length > 0 ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    {p.programs.length} Events Registered
                                </div>
                             ) : (
                                <span className="text-gray-600 text-sm italic">No events</span>
                             )}
                          </td>
                        </tr>
                      ))}
                      {(!selectedTeam.participantIds || selectedTeam.participantIds.length === 0) && (
                         <tr>
                            <td colSpan={5} className="p-16 text-center text-gray-500">
                               <div className="flex flex-col items-center justify-center gap-3">
                                   <div className="p-4 rounded-full bg-[#13111C] border border-[#2D283E]">
                                       <Users className="opacity-20" size={32} />
                                   </div>
                                   <p>No participants found in this group.</p>
                               </div>
                            </td>
                         </tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
