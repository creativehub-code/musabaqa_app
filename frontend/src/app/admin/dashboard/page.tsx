'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Users, Award, Medal, Calendar, List, X, Filter, BarChart3, TrendingUp, ChevronRight, Activity, Crown, Star, Eye, EyeOff, ChevronDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAdminData } from '../AdminContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const { programs, teams, groups, participants, refreshPrograms, loading } = useAdminData();
  const [participantCount, setParticipantCount] = useState(0);
  
  // Local state for UI
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [isProgramsVisible, setIsProgramsVisible] = useState(true);
  // Leaderboard filters
  const [leaderboardGroup, setLeaderboardGroup] = useState('All');
  const [leaderboardSort, setLeaderboardSort]   = useState<'desc'|'asc'|'az'>('desc');
  const [showLeaderboardFilter, setShowLeaderboardFilter] = useState(false);
  const [showLeaderboard, setShowLeaderboard]   = useState(true);

  const languages = ['All', 'Malayalam', 'Arabic', 'Urdu', 'English'];

  useEffect(() => {
    // Only fetch participants count locally, others from context
    const fetchParticipantsCount = async () => {
      try {
        const p = await apiRequest('/participants');
        setParticipantCount(p.length);
      } catch (error) {
        console.error("Failed to fetch participants", error);
      }
    };
    fetchParticipantsCount();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await apiRequest(`/programs/${id}`, 'PATCH', { status: newStatus });
      refreshPrograms();
    } catch (e: any) {
        alert('Failed to update status');
    }
  };

  const activePrograms = programs.filter(p => {
    const matchesStatus = p.status !== 'completed';
    const matchesLanguage = selectedLanguage === 'All' || (p.language || 'English') === selectedLanguage;
    return matchesStatus && matchesLanguage;
  });

  // Compute top 10 participants with group filter + sort
  const leaderboardGroupNames = ['All', ...groups.map((g: any) => g.name)];

  const top10Participants = [...participants]
    .filter(p => (p.totalScore || 0) > 0)
    .filter(p => leaderboardGroup === 'All' || p.groupId?.name === leaderboardGroup)
    .sort((a, b) => {
      if (leaderboardSort === 'desc') return (b.totalScore || 0) - (a.totalScore || 0);
      if (leaderboardSort === 'asc')  return (a.totalScore || 0) - (b.totalScore || 0);
      return a.name.localeCompare(b.name); // az
    })
    .slice(0, 10);

  const maxScore = top10Participants.reduce((m, p) => Math.max(m, p.totalScore || 0), 1);

  const chartData = {
    labels: teams.map(t => t.name),
    datasets: [
      {
        label: 'Total Points',
        data: teams.map(t => t.totalScore),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
          return gradient;
        },
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#9CA3AF',
        borderColor: 'rgba(75, 85, 99, 0.5)',
        borderWidth: 1,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(75, 85, 99, 0.1)' },
        ticks: { color: '#9CA3AF', font: { size: 11 } },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9CA3AF', font: { size: 11 } },
        border: { display: false }
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Dashboard Overview
          </h1>
          <p className="text-gray-400 mt-1">Monitor real-time statistics and manage events</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                <Activity size={16} />
                Live Report
            </button>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Standings Section */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={100} />
          </div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-xl font-bold text-white">Team Standings</h2>
              <p className="text-sm text-gray-400">Current performance rankings</p>
            </div>
            <Award className="text-blue-500" size={24} />
          </div>

          <div className="relative z-10 overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="w-full">
              {/* Desktop Header */}
              <div className="hidden md:flex border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider bg-gray-900/80">
                  <div className="p-4 w-24">Rank</div>
                  <div className="p-4 flex-1">Team</div>
                  <div className="p-4 text-right">Points</div>
              </div>

              <div className="divide-y divide-gray-800/50">
                {teams.length > 0 ? (
                  teams.map((team: any, index: number) => (
                    <div key={team._id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0
                            ${index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                              index === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' : 
                              index === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' : 
                              'text-white bg-gray-800'}
                          `}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-white text-lg md:text-base">{team.name}</span>
                      </div>
                      <div className="font-bold text-blue-400 text-lg md:text-base">{team.totalScore}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">No teams found.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Points Distribution Graph */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl h-[400px] flex flex-col relative overflow-hidden">
           <div className="flex items-center justify-between mb-2">
             <div>
                <h2 className="text-xl font-bold text-white">Points Distribution</h2>
                <p className="text-sm text-gray-400">Score comparison across teams</p>
             </div>
             <BarChart3 className="text-purple-500" size={24} />
           </div>
           <div className="flex-1 min-h-0 w-full">
                <Bar options={chartOptions} data={chartData} />
           </div>
        </div>
      </div>

      {/* ── Top 10 Participants Leaderboard ── */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🏆</span> Top 10 Participants
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">Ranked by total competition points earned</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort dropdown */}
              <select
                value={leaderboardSort}
                onChange={e => setLeaderboardSort(e.target.value as any)}
                className="bg-[#0F0D15] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="desc">↓ Highest First</option>
                <option value="asc">↑ Lowest First</option>
                <option value="az">A–Z Name</option>
              </select>

              {/* Filter toggle button */}
              <button
                onClick={() => setShowLeaderboardFilter(f => !f)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  leaderboardGroup !== 'All'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-[#0F0D15] text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                }`}
              >
                <Filter size={14} />
                {leaderboardGroup !== 'All' ? leaderboardGroup : 'Group'}
              </button>

              {/* Clear filter */}
              {leaderboardGroup !== 'All' && (
                <button
                  onClick={() => setLeaderboardGroup('All')}
                  className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-500/50 transition-all"
                  title="Clear group filter"
                >
                  <X size={14} />
                </button>
              )}

              <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-lg">
                {top10Participants.length} shown
              </span>

              {/* Show / Hide toggle */}
              <button
                onClick={() => setShowLeaderboard(v => !v)}
                title={showLeaderboard ? 'Hide participants' : 'Show participants'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-700 bg-[#0F0D15] text-gray-400 hover:text-white hover:border-gray-500 transition-all"
              >
                {showLeaderboard ? <EyeOff size={14} /> : <Eye size={14} />}
                {showLeaderboard ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Group filter pills — toggles on filter button click */}
          {showLeaderboardFilter && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
              <span className="text-xs text-gray-500 self-center mr-1">Filter by Group:</span>
              {leaderboardGroupNames.map(g => (
                <button
                  key={g}
                  onClick={() => { setLeaderboardGroup(g); setShowLeaderboardFilter(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    leaderboardGroup === g
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30'
                      : 'bg-[#0F0D15] text-gray-400 border-gray-700 hover:border-purple-500/50 hover:text-purple-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {showLeaderboard && (
          top10Participants.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
              <Award size={48} className="opacity-20" />
              <p>No ranked participants yet. Scores will appear after programs are calculated.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {top10Participants.map((p: any, index: number) => {
                const scorePercent = ((p.totalScore || 0) / maxScore) * 100;
                const medal =
                  index === 0 ? { emoji: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' } :
                  index === 1 ? { emoji: '🥈', color: 'text-gray-300', bg: 'bg-gray-300/10 border-gray-300/30' } :
                  index === 2 ? { emoji: '🥉', color: 'text-amber-600', bg: 'bg-amber-700/10 border-amber-700/30' } :
                                { emoji: null, color: 'text-gray-500', bg: 'bg-gray-800 border-gray-700/50' };
                return (
                  <div
                    key={p._id}
                    className={`flex items-center gap-4 p-4 px-6 hover:bg-white/5 transition-all group ${
                      index < 3 ? 'bg-gradient-to-r from-white/[0.02] to-transparent' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm shrink-0 border ${medal.bg} ${medal.color}`}>
                      {medal.emoji ? <span className="text-lg">{medal.emoji}</span> : index + 1}
                    </div>

                    {/* Participant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white truncate">{p.name}</span>
                        <span className="text-xs font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">#{p.chestNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.teamId?.name && (
                          <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            {p.teamId.name}
                          </span>
                        )}
                        {p.groupId?.name && (
                          <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            {p.groupId.name}
                          </span>
                        )}
                      </div>
                      {/* Score bar */}
                      <div className="mt-2 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-300' :
                            index === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-500' :
                            'bg-gradient-to-r from-purple-600 to-indigo-500'
                          }`}
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Score */}
                    <div className={`text-right shrink-0 font-bold text-xl tabular-nums ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-amber-500' :
                      'text-purple-400'
                    }`}>
                      {p.totalScore}
                      <span className="text-xs text-gray-500 font-normal ml-1">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Collapsed indicator */}
        {!showLeaderboard && (
          <div
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center justify-center gap-2 py-4 text-gray-600 hover:text-gray-400 cursor-pointer transition-colors text-sm select-none"
          >
            <ChevronDown size={16} />
            Click to show {top10Participants.length} participants
          </div>
        )}
      </div>


      <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-xl overflow-hidden mb-20 md:mb-0 max-w-full">
        <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Active Programs
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">
                  {programs.filter(p => p.status !== 'completed').length}
                </span>
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="bg-gray-900 p-1 rounded-lg border border-gray-800 flex w-full sm:w-auto overflow-x-auto">
                    {languages.map(lang => (
                        <button
                            key={lang}
                            onClick={() => setSelectedLanguage(lang)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                                selectedLanguage === lang
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        {isProgramsVisible && (
            <div className="overflow-x-auto">
                {activePrograms.length > 0 ? (
                <ProgramCards programs={activePrograms} onStatusUpdate={handleStatusUpdate} />
                ) : (
                <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                    <Calendar size={48} className="mb-4 opacity-20" />
                    <p>No active programs matching your filters</p>
                </div>
                )}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 rounded-2xl border border-blue-500/20 group hover:border-blue-500/40 transition-colors cursor-pointer">
            <h3 className="text-lg font-semibold text-blue-200 mb-2 group-hover:text-blue-100 flex items-center gap-2">
                Manage Participants <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-blue-400/60">View and edit registered participants details.</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 p-6 rounded-2xl border border-emerald-500/20 group hover:border-emerald-500/40 transition-colors cursor-pointer">
            <h3 className="text-lg font-semibold text-emerald-200 mb-2 group-hover:text-emerald-100 flex items-center gap-2">
                Manage Teams <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-emerald-400/60">Organize teams and track their scores.</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-6 rounded-2xl border border-amber-500/20 group hover:border-amber-500/40 transition-colors cursor-pointer">
            <h3 className="text-lg font-semibold text-amber-200 mb-2 group-hover:text-amber-100 flex items-center gap-2">
                Manage Judges <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-amber-400/60">Assign judges to programs and competition.</p>
        </div>
      </div>
    </div>
  );
}

function ProgramCards({ programs, onStatusUpdate }: { programs: any[], onStatusUpdate: (id: string, status: string) => void }) {
  return (
    <div className="w-full">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 border-b border-gray-800 text-gray-400 bg-gray-900/50 text-xs uppercase tracking-wider p-4 pl-6">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Program Name</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-2">Group</div>
            <div className="col-span-3 text-right pr-6">Status</div>
        </div>

      <div className="divide-y divide-gray-800/50">
        {programs.map((program: any, index: number) => (
          <div key={program._id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 md:pl-6 hover:bg-white/5 transition-colors group items-center">
            
            {/* Mobile: Row 1 - Icon + Name */}
            <div className="col-span-1 md:col-span-5 flex items-center gap-3 w-full">
                <span className="text-gray-500 font-mono text-sm hidden md:block w-6">{index + 1}</span>
                <div className={`p-2 rounded-lg shrink-0 ${program.status === 'ongoing' ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"}`}>
                    <Award size={18} />
                </div>
                 <div className="flex flex-col md:flex-row md:items-center gap-1">
                    <span className="font-medium text-white">{program.name}</span>
                    <span className="md:hidden text-xs text-gray-500">{program.language || 'English'} • {program.groupId?.name || 'N/A'}</span>
                 </div>
            </div>

            {/* Desktop: Language */}
             <div className="hidden md:block col-span-2">
               <span className="bg-gray-800 text-gray-300 border border-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                    {program.language || 'English'}
                </span>
            </div>

            {/* Desktop: Group */}
            <div className="hidden md:block col-span-2 text-gray-400 text-sm">{program.groupId?.name || 'N/A'}</div>

            {/* Status (Both) */}
            <div className="col-span-1 md:col-span-3 text-right flex justify-between md:justify-end items-center w-full mt-2 md:mt-0">
               {/* Mobile Rank Display */}
               <span className="md:hidden text-gray-500 font-mono text-sm">#{index + 1}</span>
               
                 <div className="relative inline-block">
                    <select 
                        value={program.status || 'upcoming'}
                        onChange={(e) => onStatusUpdate(program._id, e.target.value)}
                        className={`py-1.5 pl-3 pr-8 rounded-lg text-xs font-medium bg-gray-900 border outline-none cursor-pointer appearance-none transition-colors ${
                            program.status === 'ongoing' ? 'text-yellow-500 border-yellow-500/50 hover:border-yellow-500' :
                            program.status === 'completed' ? 'text-green-500 border-green-500/50 hover:border-green-500' :
                            'text-blue-500 border-blue-500/50 hover:border-blue-500'
                        }`}
                    >
                        <option value="upcoming" className="bg-gray-900 text-gray-300">Upcoming</option>
                        <option value="ongoing" className="bg-gray-900 text-yellow-500">Ongoing</option>
                        <option value="completed" className="bg-gray-900 text-green-500">Completed</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                 </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
