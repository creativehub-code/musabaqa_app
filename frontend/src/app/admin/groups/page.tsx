'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Trash2, X, Shield, Plus, Users, ChevronRight, Layers } from 'lucide-react';
import { useAdminData } from '../AdminContext';

export default function GroupsPage() {
  const { groups, refreshGroups } = useAdminData();
  const [name, setName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/groups', 'POST', { name });
      refreshGroups();
      setName('');
    } catch(e) { alert('Error creating group'); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await apiRequest(`/groups/${id}`, 'DELETE');
      refreshGroups();
      if (selectedGroup?._id === id) setSelectedGroup(null);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      
      {/* Header & Create Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Manage Groups</h2>
           <p className="text-gray-400 mt-1">Organize participants into competition categories.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full md:w-auto p-1.5 bg-gray-900 border border-gray-800 rounded-xl flex shadow-lg">
            <div className="relative flex-1 md:w-64">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="New Group Name" 
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
        {groups.map((g, index) => (
          <div 
            key={g._id} 
            onClick={() => setSelectedGroup(g)}
            className={`
                group relative bg-[#1E1B2E] rounded-xl p-4 border border-[#2D283E] 
                hover:border-purple-500/50 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1
                ${selectedGroup?._id === g._id ? 'ring-2 ring-purple-500 border-transparent bg-[#1E1B2E]/80' : ''}
            `}
          >
            {/* Background Gradient Blob */}
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-gray-700 font-bold text-lg text-white shadow-inner ${
                        g.name === 'Senior' ? 'bg-gradient-to-br from-blue-900 to-blue-800' :
                        g.name === 'Junior' ? 'bg-gradient-to-br from-green-900 to-green-800' :
                        'bg-gradient-to-br from-gray-800 to-gray-900'
                    }`}>
                        {g.name.charAt(0)}
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] text-gray-400 font-mono">
                        #{index + 1}
                    </div>
                </div>

                <div>
                    <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-purple-300 transition-colors truncate">{g.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users size={12} /> {g.participantIds?.length || 0}</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between mt-1">
                     <span className="flex items-center gap-1.5 text-purple-400 font-bold text-xs uppercase tracking-wider">
                        <Layers size={14} className="text-purple-500" />
                        Category
                     </span>
                     
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                             onClick={(e) => handleDelete(g._id, e)}
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

      {/* Group Details Bottom Section */}
      {selectedGroup && (
        <div className="mt-8 bg-[#1E1B2E] border border-[#2D283E] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="p-6 border-b border-[#2D283E] flex flex-col md:flex-row justify-between items-start md:items-center bg-[#13111C] gap-4">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-900/50">
                     {selectedGroup.name.charAt(0)}
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedGroup.name} Participants</h2>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400 font-medium">{selectedGroup.participantIds?.length || 0} Members</span>
                    </div>
                 </div>
              </div>

               <button 
                    onClick={() => setSelectedGroup(null)}
                    className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors border border-gray-700 hover:border-gray-600"
                >
                    <X size={20} />
                </button>
            </div>
            
            <div className="p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1A1825]">
                      <tr className="border-b border-[#2D283E] text-gray-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="p-5 w-20">#</th>
                        <th className="p-5 w-32">Chest No</th>
                        <th className="p-5">Name</th>
                        <th className="p-5">Team</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D283E]">
                      {selectedGroup.participantIds
                        ?.map((p: any, index: number, arr: any[]) => (
                        <tr key={p._id} className="hover:bg-[#252236] transition-colors group">
                          <td className="p-5 text-gray-500 font-mono text-sm">{arr.length - index}</td>
                          <td className="p-5">
                              <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#13111C] border border-gray-700 text-purple-300 font-mono text-sm font-bold shadow-sm">
                                {p.chestNumber}
                             </div>
                          </td>
                          <td className="p-5 font-bold text-white text-base group-hover:text-purple-300 transition-colors">{p.name}</td>
                          <td className="p-5 text-gray-400">{p.teamId?.name || '-'}</td>
                        </tr>
                      ))}
                      {(!selectedGroup.participantIds || selectedGroup.participantIds.length === 0) && (
                         <tr>
                            <td colSpan={4} className="p-16 text-center text-gray-500">
                               <div className="flex flex-col items-center justify-center gap-3">
                                   <div className="p-4 rounded-full bg-[#13111C] border border-[#2D283E]">
                                       <Users className="opacity-20" size={32} />
                                   </div>
                                   <p>No participants assigned to this group yet.</p>
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
