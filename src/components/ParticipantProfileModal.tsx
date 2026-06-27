import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Target, Award, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Participant, Question, Answer } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ParticipantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  questions: Question[];
  answers: Answer[];
}

export function ParticipantProfileModal({ isOpen, onClose, participant, questions, answers }: ParticipantProfileModalProps) {
  const chartData = useMemo(() => {
    if (!participant || !participant.dailyScores) return [];
    
    let cumulative = 0;
    return participant.dailyScores.map((score, index) => {
      cumulative += score;
      return {
        day: `Day ${index + 1}`,
        score: score,
        cumulative: cumulative
      };
    });
  }, [participant]);

  const participantAnswers = useMemo(() => {
    if (!participant) return [];
    
    return answers
      .filter(a => a.participantId === participant.id)
      .map(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        return {
          answer,
          question
        };
      })
      .filter(item => item.question !== undefined)
      .sort((a, b) => {
        // Sort by date (newest first)
        const dateA = new Date(a.question!.date || 0).getTime();
        const dateB = new Date(b.question!.date || 0).getTime();
        return dateB - dateA;
      });
  }, [participant, answers, questions]);

  if (!isOpen || !participant) return null;

  const totalPossiblePoints = participantAnswers.reduce((acc, curr) => acc + (curr.question?.points || 0), 0);
  const accuracy = totalPossiblePoints > 0 
    ? Math.round((participant.dailyPoints / totalPossiblePoints) * 100) 
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                {participant.name}
                <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  {participant.dailyPoints + participant.bonusPoints + participant.bumperPoints} Total Points
                </span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col">
                <span className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Target className="w-4 h-4 text-blue-500" /> Daily Points</span>
                <span className="text-2xl font-bold text-slate-800">{participant.dailyPoints}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col">
                <span className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-500" /> Bonus Points</span>
                <span className="text-2xl font-bold text-slate-800">{participant.bonusPoints}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col">
                <span className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" /> Bumper Points</span>
                <span className="text-2xl font-bold text-slate-800">{participant.bumperPoints}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col">
                <span className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-500" /> Consistency</span>
                <span className="text-2xl font-bold text-slate-800">{participant.dailyScores?.filter(s => s > 0).length || 0} <span className="text-sm font-normal text-slate-500">days active</span></span>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Progression
              </h3>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                      />
                      <Line 
                        type="monotone" 
                        name="Cumulative Points"
                        dataKey="cumulative" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Answer History */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" /> Recent Answers
                </h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {participantAnswers.length > 0 ? (
                  participantAnswers.map((item, idx) => {
                    const q = item.question!;
                    const a = item.answer;
                    const isEvaluated = q.isEvaluated;
                    const isCorrect = q.correctAnswer && q.correctAnswer === a.answer;
                    
                    return (
                      <div key={idx} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 mb-1 block">Day {q.date}</span>
                            <p className="text-sm font-medium text-slate-800">{q.text}</p>
                          </div>
                          {isEvaluated ? (
                            isCorrect ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold shrink-0">
                                <XCircle className="w-3.5 h-3.5" /> Incorrect
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold shrink-0">
                              <AlertCircle className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600 break-words">
                          <span className="font-semibold text-slate-700">Answer: </span> {a.answer}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No answer history available for this participant.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
