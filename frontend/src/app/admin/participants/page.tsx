'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '@/lib/api';
import { Trash2, Plus, X, User, Users, Flag, Save, Layers, Grid, FileText, Globe, Image, Upload } from 'lucide-react';
import { useAdminData } from '../AdminContext';

// Memoized Row Component to prevent full table re-renders on hover
const ParticipantRow = React.memo(({ p, index, displayIndex, hoveredParticipant, setHoveredParticipant, setViewParticipant, setSelectedParticipantForProgram, setShowAddProgramModal, handleDelete }: any) => {
    return (
        <tr 
            className="hover:bg-[#252236] transition-colors group cursor-pointer"
            onMouseEnter={() => setHoveredParticipant(p._id)}
            onMouseLeave={() => setHoveredParticipant(null)}
            onClick={() => setViewParticipant(p)}
        >
            <td className="p-4 text-gray-600">{displayIndex}</td>
            <td className="p-4 font-mono text-purple-300 font-bold">{p.chestNumber}</td>
            <td className="p-4">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white border-2 border-white/10">
                        {p.name.charAt(0)}
                    </div>
                    <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/participants/${p._id}/photo`} 
                        alt={p.name} 
                        loading="lazy"
                        className="absolute inset-0 w-full h-full rounded-full object-cover border-2 border-purple-500/30"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                </div>
                <span className="font-semibold text-gray-200">{p.name}</span>

            </div>
            </td>
            <td className="p-4">
            <div className="flex flex-col text-sm">
                <span className="text-gray-300 font-medium">{p.teamId?.name || 'No Team'}</span>
                <span className="text-gray-500 text-xs">{p.groupId?.name || 'No Group'}</span>
            </div>
            </td>
            <td className="p-4">
            <div className="flex flex-wrap gap-1">
                {p.programs?.length > 0 ? (
                    p.programs.slice(0, 2).map((prog: any) => (
                        <span key={prog._id || prog} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">
                            {prog.name || 'Program'}
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-gray-600 italic">None</span>
                )}
                {p.programs?.length > 2 && (
                        <span className="text-xs bg-gray-800 text-gray-500 px-2 py-1 rounded border border-gray-700">+{p.programs.length - 2}</span>
                )}
            </div>
            </td>
            <td className="p-4 relative">
            <button 
                onClick={(e) => {
                e.stopPropagation();
                handleDelete(p._id);
                }}
                className="text-gray-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Delete"
            >
                <Trash2 size={18} />
            </button>
            </td>
        </tr>
    );
});
ParticipantRow.displayName = 'ParticipantRow';

export default function ParticipantsPage() {
  const { groups, teams, programs, participants, refreshParticipants } = useAdminData(); // Use cached participants
  const [form, setForm] = useState<{
    name: string;
    chestNumber: string;
    teamId: string;
    groupId: string;
    selectedPrograms: string[];
    language: string;
    programId: string;
    image: string;
  }>({ name: '', chestNumber: '', teamId: '', groupId: '', selectedPrograms: [], language: '', programId: '', image: '' });
  
  const [search, setSearch] = useState('');
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewParticipant, setViewParticipant] = useState<any>(null);
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [selectedParticipantForProgram, setSelectedParticipantForProgram] = useState<any>(null);
  const [programForm, setProgramForm] = useState<{
    language: string; 
    programId: string;
    selectedPrograms: string[];
  }>({ language: '', programId: '', selectedPrograms: [] });

  // Derive unique languages from programs
  const languages = useMemo(() => Array.from(new Set(programs.map(p => p.language))), [programs]);
  
  // Filter programs based on selected language in main form
  const filteredProgramsMain = useMemo(() => form.language 
    ? programs.filter(p => p.language === form.language)
    : [], [programs, form.language]);

  // Filter programs based on selected language in modal
  const filteredProgramsModal = useMemo(() => programForm.language
    ? programs.filter(p => p.language === programForm.language)
    : [], [programs, programForm.language]);

  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [isAddingProgramMode, setIsAddingProgramMode] = useState(false);
  
  // Fetch full details when viewing a participant
  useEffect(() => {
    if (viewParticipant?._id) {
       // Reset add mode when opening new participant
       setIsAddingProgramMode(false);
      const fetchFullDetails = async () => {
        setIsFetchingDetails(true);
        try {
          // This now only returns text details, image is separate URL
          const fullData = await apiRequest(`/participants/${viewParticipant._id}`);
          setViewParticipant((current: any) => current?._id === fullData._id ? { ...fullData, image: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/participants/${fullData._id}/photo` } : current);
        } catch (e) {
          console.error("Failed to fetch full participant details", e);
        } finally {
            setIsFetchingDetails(false);
        }
      };
      // Only fetch if we don't have the full programs list populated or other deep details
      // Since image is now URL based, we don't strictly *need* to fetch details for image, but we might for programs.
      // Optimizing: If we already have the data, skip. But list view might be partial.
      // Let's safe fetch to stay consistent.
      fetchFullDetails();
    }
  }, [viewParticipant?._id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit
        alert("Image size must be less than 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalPrograms = [...form.selectedPrograms];
      if (form.programId && !finalPrograms.includes(form.programId)) {
          finalPrograms.push(form.programId);
      }

      await apiRequest('/participants', 'POST', {
        name: form.name,
        chestNumber: form.chestNumber,
        teamId: form.teamId,
        groupId: form.groupId,
        programs: finalPrograms,
        image: form.image
      });
      refreshParticipants();
      // Keep teamId and groupId for faster entry, reset others
      setForm(prev => ({ ...prev, name: '', chestNumber: '', selectedPrograms: [], programId: '', language: '', image: '' }));
      alert('Participant added!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = React.useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) return;
    try {
      await apiRequest(`/participants/${id}`, 'DELETE');
      refreshParticipants();
    } catch (e: any) { alert(e.message); }
  }, [refreshParticipants]);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 60;

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Memoized filtered participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.chestNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [participants, search]);

  // Slice for current page
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-12 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Manage Participants</h2>
           <p className="text-gray-400">Register new artists, manage teams, and assign programs.</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all"
        >
          {showCreateForm ? <X size={20} /> : <Plus size={20} />}
          {showCreateForm ? 'Close Form' : 'Add Participant'}
        </button>
      </div>

      {/* Main Form Card */}
      {showCreateForm && (
      <div className="bg-[#1E1B2E] rounded-3xl border border-[#2D283E] p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          
          {/* Identity Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-300">
               <User className="text-purple-500" size={24} /> Identity
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
                {/* Image Upload */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden bg-[#0F0D15] relative group">
                        {form.image ? (
                            <img src={form.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="text-gray-600" size={40} />
                        )}
                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="text-white" size={24} />
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">Max 500KB</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 content-center">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Artist/Participant Name</label>
                        <input 
                            placeholder="Enter full name" 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})}
                            className="w-full p-4 rounded-xl bg-[#13111C] border border-gray-700/50 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Chest Number</label>
                        <input 
                            placeholder="E.g. CH-101" 
                            value={form.chestNumber} 
                            onChange={e => setForm({...form, chestNumber: e.target.value})}
                            className="w-full p-4 rounded-xl bg-[#13111C] border border-gray-700/50 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                            required
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="h-px bg-gray-800/50 w-full" />

          {/* Affiliation Section (Narrative replacement) */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-300">
               <Users className="text-purple-500" size={24} /> Affiliation & Grouping
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Select Team</label>
                  <div className="relative">
                    <Flag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                        value={form.teamId} 
                        onChange={e => setForm({...form, teamId: e.target.value})}
                        className="w-full p-4 pl-12 rounded-xl bg-[#13111C] border border-gray-700/50 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Select a Team...</option>
                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Assign Group</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                        value={form.groupId} 
                        onChange={e => setForm({...form, groupId: e.target.value})}
                        className="w-full p-4 pl-12 rounded-xl bg-[#13111C] border border-gray-700/50 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Select a Group...</option>
                        {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                    </select>
                  </div>
               </div>
            </div>
          </div>

          <div className="h-px bg-gray-800/50 w-full" />

          {/* Media & Portfolio Section (Programs) */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-300">
               <Image className="text-purple-500" size={24} /> Participation & Programs
            </h3>
            <p className="text-sm text-gray-500 -mt-4 mb-4">Select programs this participant will compete in.</p>
            
            <div className="p-8 border-2 border-dashed border-gray-700/50 rounded-2xl bg-[#13111C]/50 flex flex-col gap-6">
                
                {/* Program Selectors */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Filter Language</label>
                        <select 
                          value={form.language} 
                          onChange={e => setForm({...form, language: e.target.value, programId: ''})}
                          className="w-full p-3 rounded-lg bg-[#0F0D15] border border-gray-700 text-gray-300 focus:border-purple-500 transition-colors"
                        >
                          <option value="">All Languages</option>
                          {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div className="flex-[2] w-full space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Select Program</label>
                        <select 
                          value={form.programId} 
                          onChange={e => setForm({...form, programId: e.target.value})}
                          className="w-full p-3 rounded-lg bg-[#0F0D15] border border-gray-700 text-gray-300 focus:border-purple-500 transition-colors"
                          disabled={!form.language}
                        >
                          <option value="">Choose a program...</option>
                          {filteredProgramsMain.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button 
                         type="button"
                         onClick={(e) => {
                           e.preventDefault();
                           if (form.programId && !form.selectedPrograms.includes(form.programId)) {
                             setForm(prev => ({
                               ...prev,
                               selectedPrograms: [...prev.selectedPrograms, prev.programId],
                               programId: ''
                             }));
                           }
                         }}
                         disabled={!form.programId}
                         className="h-[50px] px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus size={18} /> Add
                    </button>
                </div>

                {/* Chips Display */}
                {form.selectedPrograms.length > 0 ? (
                    <div className="flex flex-wrap gap-3 mt-2">
                        {form.selectedPrograms.map(progId => {
                            const prog = programs.find(p => p._id === progId);
                            return (
                                <div key={progId} className="flex items-center gap-2 bg-purple-900/30 text-purple-200 border border-purple-500/30 px-4 py-2 rounded-lg text-sm group hover:border-purple-400 transition-colors">
                                    <span className="font-medium">{prog?.name || 'Unknown Program'}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setForm(prev => ({ ...prev, selectedPrograms: prev.selectedPrograms.filter(id => id !== progId) }))}
                                        className="text-purple-400 hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-600 flex flex-col items-center gap-2">
                        <Grid size={40} className="opacity-20" />
                        <p>No programs added yet.</p>
                    </div>
                )}

            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-gray-800 flex justify-end gap-4">
             <button 
                type="button"
                onClick={() => {
                    setForm({ name: '', chestNumber: '', teamId: '', groupId: '', selectedPrograms: [], language: '', programId: '', image: '' });
                    setShowCreateForm(false);
                }}
                className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors"
             >
                Cancel
             </button>
             <button 
                type="submit" 
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all transform active:scale-95"
             >
                 <Save size={18} /> Save Participant
             </button>
          </div>

        </form>
      </div>
      )}

      {/* List Section Header */}
      <div className="flex items-center justify-between pt-10">
         <h2 className="text-2xl font-bold text-white">All Participants <span className="text-gray-500 text-base font-normal">({filteredParticipants.length})</span></h2>
         <div className="relative">
             <input 
                placeholder="Search participants..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg bg-[#1E1B2E] border border-[#2D283E] text-white focus:outline-none focus:border-purple-500 w-64 transition-all"
             />
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             </div>
         </div>
      </div>

      {/* Participant List (Table) */}
       <div className="bg-[#1E1B2E] rounded-2xl border border-[#2D283E] overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2D283E] text-gray-400 bg-[#13111C]">
              <th className="p-4 w-16 font-medium">#</th>
              <th className="p-4 font-medium">Chest No.</th>
              <th className="p-4 font-medium">Identity</th>
              <th className="p-4 font-medium">Affiliation</th>
              <th className="p-4 font-medium">Programs</th>
              <th className="p-4 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D283E]">
            {paginatedParticipants.map((p, index) => {
              // Calculate correct absolute number based on pagination
              const absoluteIndex = (currentPage - 1) * itemsPerPage + index;
              const displayIndex = filteredParticipants.length - absoluteIndex; 

              return (
                <ParticipantRow 
                    key={p._id}
                    p={p}
                    index={index}
                    displayIndex={displayIndex}
                    hoveredParticipant={hoveredParticipant}
                    setHoveredParticipant={setHoveredParticipant}
                    setViewParticipant={setViewParticipant}
                    setSelectedParticipantForProgram={setSelectedParticipantForProgram}
                    setShowAddProgramModal={setShowAddProgramModal}
                    handleDelete={handleDelete}
                />
              );
            })}
            {filteredParticipants.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No participants found.</td>
                </tr>
            )}
            </tbody>
        </table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="p-4 border-t border-[#2D283E] bg-[#13111C] flex justify-between items-center">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                >
                    Previous
                </button>
                <div className="text-gray-400 text-sm">
                    Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                </div>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                >
                    Next
                </button>
            </div>
        )}
      </div>

     {/* Add Program Modal (kept mostly functional/same but styled) */}
    {showAddProgramModal && selectedParticipantForProgram && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#1E1B2E] p-8 rounded-3xl border border-[#2D283E] w-full max-w-lg relative shadow-2xl">
                <button 
                    onClick={() => { setShowAddProgramModal(false); setProgramForm({ language: '', programId: '', selectedPrograms: [] }); }}
                    className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-bold mb-2 text-white">Manage Programs</h3>
                <p className="text-gray-400 mb-8 border-b border-gray-800 pb-4">Adding programs for <span className="text-purple-400 font-bold">{selectedParticipantForProgram.name}</span></p>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Filter Language</label>
                        <select 
                            value={programForm.language}
                            onChange={(e) => setProgramForm(prev => ({ ...prev, language: e.target.value, programId: '' }))}
                            className="w-full p-4 rounded-xl bg-[#13111C] border border-gray-700 text-white focus:border-purple-500 focus:outline-none"
                        >
                             <option value="">Select Language</option>
                             {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Select Program</label>
                             <select 
                                value={programForm.programId}
                                onChange={(e) => setProgramForm(prev => ({ ...prev, programId: e.target.value }))}
                                className="w-full p-4 rounded-xl bg-[#13111C] border border-gray-700 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
                                disabled={!programForm.language}
                            >
                                 <option value="">Select Program</option>
                                 {filteredProgramsModal.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                if (programForm.programId && !programForm.selectedPrograms.includes(programForm.programId)) {
                                    setProgramForm(prev => ({
                                        ...prev,
                                        selectedPrograms: [...prev.selectedPrograms, prev.programId],
                                        programId: ''
                                    }));
                                }
                            }}
                            disabled={!programForm.programId}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold h-[56px] w-[56px] flex items-center justify-center shadow-lg shadow-purple-900/20"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    {/* Selected Programs Chips in Modal */}
                    {programForm.selectedPrograms.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-[#13111C] rounded-xl border border-dashed border-gray-700/50 max-h-40 overflow-y-auto">
                        {programForm.selectedPrograms.map(progId => {
                            const prog = programs.find(p => p._id === progId);
                            return (
                            <div key={progId} className="flex items-center gap-2 bg-purple-500/10 text-purple-200 border border-purple-500/20 px-3 py-1.5 rounded-lg text-sm">
                                {prog?.name || 'Unknown Program'}
                                <button 
                                type="button" 
                                onClick={() => setProgramForm(prev => ({ ...prev, selectedPrograms: prev.selectedPrograms.filter(id => id !== progId) }))}
                                className="hover:text-white"
                                >
                                <X size={14} />
                                </button>
                            </div>
                            );
                        })}
                        </div>
                    )}

                    <button 
                        onClick={async () => {
                            if(programForm.selectedPrograms.length === 0 && !programForm.programId) return alert("Select at least one program");
                            
                            // Add currently selected program if not in list
                            const finalProgramsToAdd = [...programForm.selectedPrograms];
                            if (programForm.programId && !finalProgramsToAdd.includes(programForm.programId)) {
                                finalProgramsToAdd.push(programForm.programId);
                            }

                            try {
                                const newPrograms = selectedParticipantForProgram.programs 
                                    ? [...selectedParticipantForProgram.programs.map((p:any) => p._id || p), ...finalProgramsToAdd] 
                                    : [...finalProgramsToAdd];

                                // Removing duplicates just in case
                                const uniquePrograms = Array.from(new Set(newPrograms));

                                await apiRequest(`/participants/${selectedParticipantForProgram._id}`, 'PUT', {
                                    ...selectedParticipantForProgram,
                                    programs: uniquePrograms,
                                    teamId: selectedParticipantForProgram.teamId?._id, // Ensure we send IDs not objects
                                    groupId: selectedParticipantForProgram.groupId?._id 
                                });
                                
                                alert("Programs added!");
                                setShowAddProgramModal(false);
                                setProgramForm({ language: '', programId: '', selectedPrograms: [] });
                                refreshParticipants();
                            } catch(e:any) {
                                alert(e.message);
                            }
                        }}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold shadow-xl shadow-green-900/20 text-lg mt-4"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )}
      {/* View Participant Modal */}
      {viewParticipant && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setViewParticipant(null)}>
            <div 
                className={`bg-[#1E1B2E] p-0 rounded-[40px] border border-[#2D283E] w-full ${isAddingProgramMode ? 'max-w-sm' : 'max-w-lg'} max-h-[90vh] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-300 ease-in-out`}
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header with Gradient */}
                <div className={`bg-gradient-to-r from-purple-900/50 to-indigo-900/50 relative transition-all duration-300 ${isAddingProgramMode ? 'p-4' : 'p-8'}`}>
                   <button 
                        onClick={() => setViewParticipant(null)}
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className={`flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left transition-all duration-300 ${isAddingProgramMode ? 'gap-4' : 'gap-6'}`}>
                        {/* Avatar */}
                        <div className={`rounded-full border-4 border-[#1E1B2E] shadow-xl overflow-hidden bg-gray-800 flex-shrink-0 relative transition-all duration-300 ${isAddingProgramMode ? 'w-16 h-16 border-2' : 'w-32 h-32 border-4'}`}>
                             {/* We use specific timestamp to bust cache if needed, or just ID */}
                             <img 
                                key={viewParticipant._id}
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/participants/${viewParticipant._id}/photo`} 
                                alt={viewParticipant.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.add('fallback-visible');
                                }}
                                onLoad={(e) => {
                                    e.currentTarget.style.display = 'block';
                                }}
                             />
                             {/* Fallback Initial - hidden by default unless image fails or is hidden */}
                             <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white -z-10 ${isAddingProgramMode ? 'text-xl' : 'text-4xl'}`}>
                                {viewParticipant.name.charAt(0)}
                             </div>
                        </div>
                        
                        <div className={`space-y-2 mt-2 transition-all duration-300 ${isAddingProgramMode ? 'mt-0 space-y-1' : 'mt-2 space-y-2'}`}>
                             {!isAddingProgramMode && (
                                <div className="inline-block px-3 py-1 rounded-full bg-black/30 border border-white/10 text-xs font-mono text-purple-300 mb-1">
                                    {viewParticipant.chestNumber}
                                </div>
                             )}
                             <h3 className={`font-extrabold text-white transition-all duration-300 ${isAddingProgramMode ? 'text-xl' : 'text-3xl'}`}>
                                {viewParticipant.name}
                                {isAddingProgramMode && <span className="ml-2 text-sm font-normal text-purple-300 font-mono">({viewParticipant.chestNumber})</span>}
                             </h3>
                             <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-300">
                                <span className="flex items-center gap-1.5"><Flag size={14} className="text-purple-400" /> {viewParticipant.teamId?.name || 'No Team'}</span>
                                <span className="flex items-center gap-1.5"><Layers size={14} className="text-indigo-400" /> {viewParticipant.groupId?.name || 'No Group'}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Modal Body */}
                <div className={`${isAddingProgramMode ? 'p-4' : 'p-8'} space-y-6 overflow-y-auto custom-scrollbar`}>
                    {isAddingProgramMode ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                             <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Plus size={16} className="text-purple-400" /> Add New Programs
                            </h4>
                            
                            <div className="space-y-4 bg-[#13111C] p-4 rounded-2xl border border-[#2D283E]">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Filter Language</label>
                                    <select 
                                        value={programForm.language}
                                        onChange={(e) => setProgramForm(prev => ({ ...prev, language: e.target.value, programId: '' }))}
                                        className="w-full p-4 rounded-xl bg-[#1E1B2E] border border-gray-700 text-white focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="">Select Language</option>
                                        {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Select Program</label>
                                        <select 
                                            value={programForm.programId}
                                            onChange={(e) => setProgramForm(prev => ({ ...prev, programId: e.target.value }))}
                                            className="w-full p-4 rounded-xl bg-[#1E1B2E] border border-gray-700 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
                                            disabled={!programForm.language}
                                        >
                                            <option value="">Select Program</option>
                                            {filteredProgramsModal.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (programForm.programId && !programForm.selectedPrograms.includes(programForm.programId)) {
                                                setProgramForm(prev => ({
                                                    ...prev,
                                                    selectedPrograms: [...prev.selectedPrograms, prev.programId],
                                                    programId: ''
                                                }));
                                            }
                                        }}
                                        disabled={!programForm.programId}
                                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold h-[56px] w-[56px] flex items-center justify-center shadow-lg shadow-purple-900/20 flex-shrink-0"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>

                                {/* Selected Programs Chips */}
                                {programForm.selectedPrograms.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-3 bg-[#1E1B2E] rounded-xl border border-dashed border-gray-700/50 max-h-40 overflow-y-auto">
                                    {programForm.selectedPrograms.map(progId => {
                                        const prog = programs.find(p => p._id === progId);
                                        return (
                                        <div key={progId} className="flex items-center gap-2 bg-purple-500/10 text-purple-200 border border-purple-500/20 px-3 py-1.5 rounded-lg text-sm">
                                            {prog?.name || 'Unknown Program'}
                                            <button 
                                            type="button" 
                                            onClick={() => setProgramForm(prev => ({ ...prev, selectedPrograms: prev.selectedPrograms.filter(id => id !== progId) }))}
                                            className="hover:text-white"
                                            >
                                            <X size={14} />
                                            </button>
                                        </div>
                                        );
                                    })}
                                    </div>
                                )}
                                
                                <button 
                                    onClick={async () => {
                                        if(programForm.selectedPrograms.length === 0 && !programForm.programId) return alert("Select at least one program");
                                        
                                        const finalProgramsToAdd = [...programForm.selectedPrograms];
                                        if (programForm.programId && !finalProgramsToAdd.includes(programForm.programId)) {
                                            finalProgramsToAdd.push(programForm.programId);
                                        }

                                        try {
                                            const newPrograms = viewParticipant.programs 
                                                ? [...viewParticipant.programs.map((p:any) => p._id || p), ...finalProgramsToAdd] 
                                                : [...finalProgramsToAdd];

                                            const uniquePrograms = Array.from(new Set(newPrograms));

                                            await apiRequest(`/participants/${viewParticipant._id}`, 'PUT', {
                                                ...viewParticipant,
                                                programs: uniquePrograms,
                                                teamId: viewParticipant.teamId?._id || viewParticipant.teamId,
                                                groupId: viewParticipant.groupId?._id || viewParticipant.groupId
                                            });
                                            
                                            // Refresh view
                                            const updated = await apiRequest(`/participants/${viewParticipant._id}`);
                                            setViewParticipant((curr: any) => ({ ...updated, image: curr.image })); // Keep image URL
                                            
                                            alert("Programs added!");
                                            setIsAddingProgramMode(false);
                                            setProgramForm({ language: '', programId: '', selectedPrograms: [] });
                                            refreshParticipants();
                                        } catch(e:any) {
                                            alert(e.message);
                                        }
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold shadow-xl shadow-green-900/20 text-lg flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Save & Add Programs
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Grid size={16} /> Registered Programs
                            </h4>
                            
                            {viewParticipant.programs?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {viewParticipant.programs.map((prog: any) => (
                                        <div key={prog._id || prog} className="bg-[#13111C] p-3 rounded-xl border border-[#2D283E] flex items-center justify-between group hover:border-purple-500/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 text-xs font-bold">
                                                    {prog.language ? prog.language.substring(0,2).toUpperCase() : 'ALL'}
                                                </div>
                                                <span className="text-gray-200 text-sm font-medium">{prog.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-[#13111C] rounded-2xl border border-dashed border-[#2D283E] text-gray-500">
                                    <p>No programs assigned yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-6 border-t border-[#2D283E] bg-[#13111C] flex justify-between">
                    {isAddingProgramMode ? (
                        <button 
                            onClick={() => setIsAddingProgramMode(false)}
                            className="px-6 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg font-bold transition-colors"
                        >
                            Cancel
                        </button>
                    ) : (
                         <button 
                            onClick={() => {
                                setIsAddingProgramMode(true);
                                setProgramForm({ language: '', programId: '', selectedPrograms: [] });
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
                        >
                            <Plus size={18} /> Add Programs
                        </button>
                    )}
                   
                    <button 
                        onClick={() => setViewParticipant(null)}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
