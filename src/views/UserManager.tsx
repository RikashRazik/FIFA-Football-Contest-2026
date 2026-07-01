import React, { useState } from 'react';
import { Participant } from '../types';
import { Search, Plus, Minus, UserPlus, Edit2, Check, X, Trash2, Users, MoreVertical, Download, Upload, ArrowDownAZ, Clock } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { ImportModal } from '../components/ImportModal';
import { ExportModal } from '../components/ExportModal';
import { toast } from 'react-hot-toast';

interface UserManagerProps {
  participants: Participant[];
  addParticipant: (name: string, uniqueId?: string) => Promise<string | undefined> | void;
  updateParticipantName: (id: string, name: string) => void;
  updateParticipantDailyScore: (id: string, dayIndex: number, score: number) => void;
  removeParticipantDailyScore: (id: string, dayIndex: number) => void;
  deleteParticipant: (id: string) => void;
  onParticipantClick?: (participant: Participant) => void;
}

export function UserManager({ 
  participants, 
  addParticipant, 
  updateParticipantName, 
  updateParticipantDailyScore, 
  removeParticipantDailyScore,
  deleteParticipant,
  onParticipantClick
}: UserManagerProps) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'recent'>('recent');
  const [newUserName, setNewUserName] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingDay, setEditingDay] = useState<{ dayIndex: number, score: number } | null>(null);
  
  const [userToDelete, setUserToDelete] = useState<Participant | null>(null);
  const [dayToDelete, setDayToDelete] = useState<{ userId: string, dayIndex: number } | null>(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [generatedUserId, setGeneratedUserId] = useState<string | null>(null);

  const sortedParticipants = [...participants].sort((a, b) => {
    if (sortOrder === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else {
      // Recent first (id is timestamp)
      return b.id.localeCompare(a.id);
    }
  });

  const filtered = sortedParticipants.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const uid = await addParticipant(newUserName.trim());
    if (uid) {
      setGeneratedUserId(uid);
    }
    // We don't close the modal immediately so they can see the ID
  };

  const resetAddUserModal = () => {
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setGeneratedUserId(null);
  };

  const handleOpenUserModal = (user: Participant) => {
    setSelectedUser(user);
    setEditName(user.name);
    setIsEditingName(false);
    setEditingDay(null);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setEditingDay(null);
    setIsEditingName(false);
  };

  const handleSaveName = () => {
    if (selectedUser && editName.trim() && editName.trim() !== selectedUser.name) {
      updateParticipantName(selectedUser.id, editName.trim());
      // Update selectedUser state locally for immediate UI feedback
      setSelectedUser({ ...selectedUser, name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSaveDayScore = () => {
    if (selectedUser && editingDay) {
      updateParticipantDailyScore(selectedUser.id, editingDay.dayIndex, editingDay.score);
      // Update locally
      const updatedScores = [...(selectedUser.dailyScores || [])];
      while (updatedScores.length <= editingDay.dayIndex) {
        updatedScores.push(0);
      }
      updatedScores[editingDay.dayIndex] = Math.max(0, editingDay.score);
      const newDailyPoints = updatedScores.reduce((sum, s) => sum + s, 0);
      setSelectedUser({ ...selectedUser, dailyScores: updatedScores, dailyPoints: newDailyPoints });
      setEditingDay(null);
    }
  };

  const handleRemoveDayScore = () => {
    if (dayToDelete) {
      removeParticipantDailyScore(dayToDelete.userId, dayToDelete.dayIndex);
      if (selectedUser && selectedUser.id === dayToDelete.userId) {
        const updatedScores = [...(selectedUser.dailyScores || [])];
        updatedScores.splice(dayToDelete.dayIndex, 1);
        const newDailyPoints = updatedScores.reduce((sum, s) => sum + s, 0);
        setSelectedUser({ ...selectedUser, dailyScores: updatedScores, dailyPoints: newDailyPoints });
      }
      setDayToDelete(null);
      toast.success('Day score removed successfully!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">User Management</h2>
          <p className="text-slate-500 mt-1">Manage participants and their day-wise scores.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search participants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <button
          onClick={() => setSortOrder(prev => prev === 'alphabetical' ? 'recent' : 'alphabetical')}
          className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 p-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center shrink-0"
          title={`Sort by ${sortOrder === 'alphabetical' ? 'Recently Added' : 'Alphabetical'}`}
        >
          {sortOrder === 'alphabetical' ? <ArrowDownAZ className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        </button>
        <div className="flex justify-end gap-3 flex-wrap">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 p-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center"
            title="Import Users"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 p-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center"
            title="Export Users"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsAddUserModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center"
            title="Add New Participant"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="py-4 px-6 font-medium">Participant</th>
                <th className="py-4 px-6 font-medium text-center">Unique ID</th>
                <th className="py-4 px-6 font-medium text-center">Total Daily Points</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>No participants found matching "{search}"</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <button 
                          onClick={() => {
                            if (onParticipantClick) onParticipantClick(p);
                          }}
                          className="font-medium text-slate-900 hover:text-indigo-600 hover:underline text-left"
                        >
                          {p.name}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-sm font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                        {p.uniqueId || '----'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-lg font-bold text-slate-700">
                        {p.dailyPoints}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenUserModal(p)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                          title="Manage User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setUserToDelete(p)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium text-lg"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setIsEditingName(false); setEditName(selectedUser.name); }} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-2xl">{selectedUser.name}</h3>
                    <button onClick={() => setIsEditingName(true)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setUserToDelete(selectedUser)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete User
                </button>
                <button onClick={handleCloseUserModal} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Day-wise Scores</h4>
                  <p className="text-sm text-slate-500">Total: {selectedUser.dailyPoints} pts</p>
                </div>
                <button 
                  onClick={() => setEditingDay({ dayIndex: (selectedUser.dailyScores?.length || 0), score: 0 })}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Next Day
                </button>
              </div>

              {/* Day Score Editor */}
              {editingDay && (
                <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm animate-in slide-in-from-top-2">
                  <div className="font-medium text-indigo-900">
                    Day {editingDay.dayIndex + 1} Score:
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setEditingDay({ ...editingDay, score: Math.max(0, editingDay.score - 1) })}
                      className="w-10 h-10 rounded-full bg-white border border-indigo-200 flex items-center justify-center hover:bg-indigo-100 text-indigo-600 transition-colors shadow-sm"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center font-mono font-bold text-xl text-slate-900">{editingDay.score}</span>
                    <button 
                      onClick={() => setEditingDay({ ...editingDay, score: editingDay.score + 1 })}
                      className="w-10 h-10 rounded-full bg-white border border-indigo-200 flex items-center justify-center hover:bg-indigo-100 text-indigo-600 transition-colors shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingDay(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSaveDayScore} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">Save Score</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedUser.dailyScores && selectedUser.dailyScores.map((score, idx) => (
                  <div key={idx} className="group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day {idx + 1}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button 
                          onClick={() => setEditingDay({ dayIndex: idx, score })}
                          className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded"
                          title="Edit Score"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDayToDelete({ userId: selectedUser.id, dayIndex: idx })}
                          className="p-1 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded"
                          title="Delete Day"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`font-mono text-3xl font-bold leading-none ${score > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{score}</span>
                      <span className="text-sm font-medium text-slate-500 mb-0.5">pts</span>
                    </div>
                  </div>
                ))}
                {(!selectedUser.dailyScores || selectedUser.dailyScores.length === 0) && (
                  <div className="col-span-full py-8 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                    <p>No day-wise scores recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirm */}
      <ConfirmModal 
        isOpen={!!userToDelete}
        title="Delete Participant"
        message={`Are you sure you want to remove ${userToDelete?.name}? This will permanently delete their scores and history. This action cannot be undone.`}
        onConfirm={() => {
          if (userToDelete) {
            deleteParticipant(userToDelete.id);
            if (selectedUser?.id === userToDelete.id) {
              handleCloseUserModal();
            }
            setUserToDelete(null);
            toast.success('Participant deleted successfully!');
          }
        }}
        onCancel={() => setUserToDelete(null)}
      />

      {/* Delete Day Confirm */}
      <ConfirmModal 
        isOpen={!!dayToDelete}
        title={`Delete Day ${dayToDelete ? dayToDelete.dayIndex + 1 : ''}`}
        message="Are you sure you want to delete the score for this day? This will remove the day completely and shift subsequent days. This action cannot be undone."
        onConfirm={handleRemoveDayScore}
        onCancel={() => setDayToDelete(null)}
      />

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Add New Participant
              </h3>
              <button 
                onClick={resetAddUserModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {!generatedUserId ? (
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Participant Name</label>
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="Enter participant name"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={resetAddUserModal}
                      className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add User
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">User Added Successfully!</h4>
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-900">{newUserName}</span> has been added to the contest.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 inline-block mx-auto min-w-[200px]">
                    <p className="text-sm font-medium text-slate-500 mb-1">Generated Unique ID</p>
                    <p className="font-mono text-2xl font-bold text-indigo-700 tracking-wider">
                      {generatedUserId}
                    </p>
                  </div>
                  <div className="pt-6">
                    <button 
                      onClick={resetAddUserModal}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        participants={participants}
      />
      
      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(importedParticipants) => {
          importedParticipants.forEach(p => {
             addParticipant(p.name, p.uniqueId);
          });
        }}
      />
    </div>
  );
}
