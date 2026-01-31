'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Plus, Trash2, UserPlus, X } from 'lucide-react';
import { useAdminData } from '../AdminContext';

export default function JudgesPage() {
  const { programs } = useAdminData(); // Use cached programs
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [assignedProgramId, setAssignedProgramId] = useState('');

  const fetchJudges = async () => {
    try {
      const judgesData = await apiRequest('/judges');
      setJudges(judgesData);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudges();
  }, []);

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/judges', 'POST', {
        name,
        email,
        password,
        assignedProgramId: assignedProgramId || null
      });
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setAssignedProgramId('');
      fetchJudges(); // Refresh list
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this judge?')) return;
    try {
      await apiRequest(`/judges/${id}`, 'DELETE');
      fetchJudges();
    } catch (error: any) {
       alert(error.message);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Judges Management
          </h1>
          <p className="text-gray-400 mt-2">Create and manage competition judges</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-purple-900/20"
        >
          <UserPlus size={20} />
          Add Judge
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading judges...</div>
      ) : (
        <div className="grid gap-4">
          {judges.map((judge) => (
            <div key={judge._id} className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex justify-between items-center hover:border-purple-500/30 transition">
              <div>
                <h3 className="text-xl font-bold text-white">{judge.name}</h3>
                <p className="text-gray-400 text-sm">{judge.email}</p>
                <div className="mt-2 flex gap-2">
                    {judge.assignedPrograms?.map((p: any) => (
                        <span key={p._id} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            {p.name}
                        </span>
                    ))}
                    {(!judge.assignedPrograms || judge.assignedPrograms.length === 0) && (
                        <span className="text-xs text-gray-600 italic">No specific assignment</span>
                    )}
                </div>
              </div>
              <button 
                onClick={() => handleDelete(judge._id)}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {judges.length === 0 && (
            <div className="text-center p-12 bg-gray-900/50 rounded-xl border border-dashed border-gray-800 text-gray-500">
                No judges found. Create one to get started.
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-white">Add New Judge</h2>
            
            <form onSubmit={handleCreateJudge} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                  placeholder="Judge Name"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                  placeholder="judge@example.com"
                />
              </div>

               <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                  placeholder="secret123"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Assign Category (Optional)</label>
                <select
                  value={assignedProgramId}
                  onChange={e => setAssignedProgramId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                >
                    <option value="">-- No Specific Assignment --</option>
                    {programs.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    If selected, the judge can handle this program. (Logic depends on implementation)
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg mt-4 transition"
              >
                Create Judge
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
