'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '@/lib/api';
import { Plus, Trash2, Users, X, UserMinus, Edit3 } from 'lucide-react';
import { useAdminData } from '../AdminContext';

export default function JudgeGroupsPage() {
  const { programs } = useAdminData(); // Use cached programs
  const [judgeGroups, setJudgeGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Form State
  const [groupName, setGroupName] = useState('');
  const [judgesInput, setJudgesInput] = useState([{ name: '', email: '', password: '' }]);
  const [assignedProgramIds, setAssignedProgramIds] = useState<string[]>([]);

  const fetchJudgeGroups = async () => {
    try {
      const data = await apiRequest('/judgeGroups');
      setJudgeGroups(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgeGroups();
  }, []);

  // Compute assigned programs to disable/sort them
  const programAssignmentStatus = useMemo(() => {
    const assignedToMap = new Map<string, string>(); // programId -> groupName
    judgeGroups.forEach(group => {
        group.assignedPrograms?.forEach((p: any) => {
            assignedToMap.set(p._id, group.name);
        });
    });

    return programs.map(p => ({
        ...p,
        assignedToGroupName: assignedToMap.get(p._id) || null
    })).sort((a, b) => {
        // Sort unassigned first, assigned last
        if (a.assignedToGroupName && !b.assignedToGroupName) return 1;
        if (!a.assignedToGroupName && b.assignedToGroupName) return -1;
        return a.name.localeCompare(b.name);
    });
  }, [programs, judgeGroups]);

  const handleAddJudgeInput = () => {
    setJudgesInput([...judgesInput, { name: '', email: '', password: '' }]);
  };

  const handleRemoveJudgeInput = (index: number) => {
    setJudgesInput(judgesInput.filter((_, i) => i !== index));
  };

  const handleJudgeInputChange = (index: number, field: string, value: string) => {
    const newInputs = [...judgesInput];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setJudgesInput(newInputs);
  };

  const handleCreateJudgeGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Basic validation
      if (judgesInput.length === 0) {
          alert('At least one judge must be added to the group.');
          return;
      }
      
      await apiRequest('/judgeGroups', 'POST', {
        name: groupName,
        judges: judgesInput,
        assignedProgramIds
      });
      
      setShowModal(false);
      setGroupName('');
      setJudgesInput([{ name: '', email: '', password: '' }]);
      setAssignedProgramIds([]);
      fetchJudgeGroups(); // Refresh list
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this judge group? All associated judges and their access will be removed.')) return;
    try {
      await apiRequest(`/judgeGroups/${id}`, 'DELETE');
      fetchJudgeGroups();
    } catch (error: any) {
       alert(error.message);
    }
  }

  const openEditModal = (group: any) => {
      setEditingGroupId(group._id);
      setAssignedProgramIds(group.assignedPrograms?.map((p: any) => p._id) || []);
      setShowEditModal(true);
  };

  const handleUpdatePrograms = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingGroupId) return;

      try {
          await apiRequest(`/judgeGroups/${editingGroupId}`, 'PATCH', {
              assignedProgramIds
          });
          setShowEditModal(false);
          setEditingGroupId(null);
          setAssignedProgramIds([]);
          fetchJudgeGroups(); // Refresh
      } catch(error: any) {
          alert(error.message);
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Judge Groups (Panels)
          </h1>
          <p className="text-gray-400 mt-2">Create and manage judging panels for programs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-purple-900/20"
        >
          <Users size={20} />
          Add Judge Group
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading judge groups...</div>
      ) : (
        <div className="grid gap-6">
          {judgeGroups.map((group) => (
            <div key={group._id} className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-purple-500/30 transition shadow-xl">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-800">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{group.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users size={16} /> 
                        <span>{group.judges?.length || 0} Judges</span>
                    </div>
                </div>
                <button 
                    onClick={() => handleDeleteGroup(group._id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                    title="Delete Group"
                >
                    <Trash2 size={20} />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                  {/* Judges List */}
                  <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Panel Members</h4>
                      <div className="space-y-2">
                          {group.judges?.map((judge: any) => (
                              <div key={judge._id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 flex flex-col">
                                  <span className="text-purple-300 font-medium">{judge.name}</span>
                                  <span className="text-xs text-gray-500">{judge.email}</span>
                              </div>
                          ))}
                          {(!group.judges || group.judges.length === 0) && (
                              <div className="text-sm text-gray-500 italic">No judges in this panel</div>
                          )}
                      </div>
                  </div>

                  {/* Assigned Programs */}
                  <div>
                      <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Assigned Programs</h4>
                          <button 
                              onClick={() => openEditModal(group)}
                              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1 transition"
                          >
                              <Edit3 size={12} /> Edit Programs
                          </button>
                      </div>
                      <div className="flex flex-wrap gap-2 auto-rows-max">
                          {group.assignedPrograms?.map((p: any) => (
                              <div key={p._id} className="flex flex-col bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                                  <span className="text-xs font-medium text-purple-300">
                                      {p.name}
                                  </span>
                                  {p.language && (
                                      <span className="text-[10px] text-purple-400/70 uppercase tracking-wider font-bold">
                                          {p.language}
                                      </span>
                                  )}
                              </div>
                          ))}
                          {(!group.assignedPrograms || group.assignedPrograms.length === 0) && (
                              <div className="text-sm text-gray-500 italic">No programs assigned</div>
                          )}
                      </div>
                  </div>
              </div>
            </div>
          ))}
          {judgeGroups.length === 0 && (
            <div className="text-center p-16 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-700" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">No judge groups found</h3>
                <p>Create a panel of judges and assign them to specific programs.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <Users className="text-purple-500" /> Create Judge Group
            </h2>
            
            <form onSubmit={handleCreateJudgeGroup} className="space-y-6">
              
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                  placeholder="e.g., Quran Memorization Panel A"
                />
              </div>

              <hr className="border-gray-800" />

              {/* Judges Section */}
              <div>
                  <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-300">Add Judges to Panel</label>
                      <button 
                          type="button" 
                          onClick={handleAddJudgeInput}
                          className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                          <Plus size={14} /> Add Another
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      {judgesInput.map((judge, idx) => (
                          <div key={idx} className="bg-[#13111C] p-4 rounded-xl border border-gray-800 relative group">
                             {judgesInput.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveJudgeInput(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <UserMinus size={14} />
                                </button>
                             )}
                             <div className="grid md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Name</label>
                                    <input
                                        type="text" required
                                        value={judge.name}
                                        onChange={e => handleJudgeInputChange(idx, 'name', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none"
                                        placeholder="Judge Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Email</label>
                                    <input
                                        type="email" required
                                        value={judge.email}
                                        onChange={e => handleJudgeInputChange(idx, 'email', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none"
                                        placeholder="judge@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Password</label>
                                    <input
                                        type="text" required
                                        value={judge.password}
                                        onChange={e => handleJudgeInputChange(idx, 'password', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none"
                                        placeholder="secret123"
                                    />
                                </div>
                             </div>
                          </div>
                      ))}
                  </div>
              </div>

              <hr className="border-gray-800" />
              
              {/* Programs Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    Assign Programs
                    <span className="text-xs font-normal text-gray-500 ml-auto">
                        {assignedProgramIds.length} selected
                    </span>
                </label>
                <div className="bg-[#13111C] border border-gray-800 rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar space-y-2 relative">
                  {programAssignmentStatus.length === 0 ? (
                      <div className="text-sm text-gray-500 italic text-center py-4">No programs available</div>
                  ) : (
                      programAssignmentStatus.map((p: any) => {
                        const isAlreadyAssigned = !!p.assignedToGroupName;
                        return (
                        <label key={p._id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isAlreadyAssigned ? 'opacity-50 cursor-not-allowed bg-red-900/10' : 'cursor-pointer hover:bg-gray-800/50 group'}`}>
                            <div className="relative flex items-center justify-center shrink-0">
                                <input
                                type="checkbox"
                                disabled={isAlreadyAssigned}
                                checked={assignedProgramIds.includes(p._id)}
                                onChange={e => {
                                    if (e.target.checked) setAssignedProgramIds([...assignedProgramIds, p._id]);
                                    else setAssignedProgramIds(assignedProgramIds.filter(id => id !== p._id));
                                }}
                                className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-gray-900 checked:bg-purple-600 checked:border-purple-600 transition-colors disabled:cursor-not-allowed cursor-pointer"
                                />
                                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex flex-col flex-1">
                                <div className="flex justify-between items-center">
                                    <span className={assignedProgramIds.includes(p._id) ? "text-white font-medium" : "text-gray-400 group-hover:text-gray-300"}>
                                        {p.name}
                                    </span>
                                    {isAlreadyAssigned && (
                                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                                            Assigned to: {p.assignedToGroupName}
                                        </span>
                                    )}
                                </div>
                                {p.language && (
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                                        Language: {p.language}
                                    </span>
                                )}
                            </div>
                        </label>
                      )})
                  )}
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 mt-8 border-t border-gray-800 sticky bottom-0 bg-gray-900 pb-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-2"
                  >
                    <Users size={20} /> Create Judge Panel
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Programs Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-xl shadow-2xl relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => {
                  setShowEditModal(false);
                  setEditingGroupId(null);
                  setAssignedProgramIds([]);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <Edit3 className="text-purple-500" /> Edit Assigned Programs
            </h2>
            
            <form onSubmit={handleUpdatePrograms} className="flex flex-col flex-1 min-h-0">
               <p className="text-sm text-gray-400 mb-4">
                   Update the programs that this Judge Panel is authorized to evaluate. Changes take effect immediately.
               </p>

              <div className="bg-[#13111C] border border-gray-800 rounded-xl p-4 overflow-y-auto custom-scrollbar space-y-2 flex-1 relative mb-6">
                  {programAssignmentStatus.length === 0 ? (
                      <div className="text-sm text-gray-500 italic text-center py-4">No programs available</div>
                  ) : (
                      programAssignmentStatus.map((p: any) => {
                        // In edit mode, we only disable if it's assigned to a DIFFERENT group
                        const editingGroup = judgeGroups.find(g => g._id === editingGroupId);
                        const isAssignedToOtherGroup = p.assignedToGroupName && p.assignedToGroupName !== editingGroup?.name;

                        return (
                        <label key={p._id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isAssignedToOtherGroup ? 'opacity-50 cursor-not-allowed bg-red-900/10' : 'cursor-pointer hover:bg-gray-800/50 group'}`}>
                            <div className="relative flex items-center justify-center shrink-0">
                                <input
                                type="checkbox"
                                disabled={isAssignedToOtherGroup}
                                checked={assignedProgramIds.includes(p._id)}
                                onChange={e => {
                                    if (e.target.checked) setAssignedProgramIds([...assignedProgramIds, p._id]);
                                    else setAssignedProgramIds(assignedProgramIds.filter(id => id !== p._id));
                                }}
                                className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-gray-900 checked:bg-purple-600 checked:border-purple-600 transition-colors disabled:cursor-not-allowed cursor-pointer"
                                />
                                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex flex-col flex-1">
                                <div className="flex justify-between items-center">
                                    <span className={assignedProgramIds.includes(p._id) ? "text-white font-medium" : "text-gray-400 group-hover:text-gray-300"}>
                                        {p.name}
                                    </span>
                                    {isAssignedToOtherGroup && (
                                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                                            Assigned to: {p.assignedToGroupName}
                                        </span>
                                    )}
                                </div>
                                {p.language && (
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                                        Language: {p.language}
                                    </span>
                                )}
                            </div>
                        </label>
                      )})
                  )}
              </div>

              <div className="pt-4 border-t border-gray-800 mt-auto">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-2"
                  >
                     Save Changes
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
