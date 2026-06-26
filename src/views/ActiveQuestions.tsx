import React, { useState, useEffect, useMemo } from 'react';
import { Question, Participant, Answer } from '../types';
import { Clock, Users, Activity, Trash2 } from 'lucide-react';
import { isQuestionTimedOut } from '../utils';

const CountdownTimer: React.FC<{ endTime: string, date: string }> = ({ endTime, date }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!endTime) return '';
      const now = new Date();
      let targetTime;
      if (endTime.includes('T')) {
        targetTime = new Date(endTime);
      } else {
        const timeStr = endTime.length === 5 ? `${endTime}:00` : endTime;
        targetTime = new Date(`${date}T${timeStr}`);
      }
      
      const diff = targetTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        return 'Expired';
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, date]);

  if (!timeLeft) return null;

  const isExpired = timeLeft === 'Expired';

  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shrink-0 ${
      isExpired ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
    }`}>
      <Clock className="w-3 h-3" />
      {isExpired ? 'Time is up' : `${timeLeft} left`}
    </span>
  );
};

interface ActiveQuestionsProps {
  questions: Question[];
  participants: Participant[];
  answers: Answer[];
  deleteParticipantAnswers: (participantId: string, questionIds: string[]) => void;
}

export function ActiveQuestions({ questions, participants, answers, deleteParticipantAnswers }: ActiveQuestionsProps) {
  const activeQuestions = useMemo(() => {
    return questions.filter(q => q.status === 'active' && !isQuestionTimedOut(q));
  }, [questions]);

  const submissions = useMemo(() => {
    if (activeQuestions.length === 0) return [];

    const questionIds = activeQuestions.map(q => q.id);
    const relevantAnswers = answers.filter(a => questionIds.includes(a.questionId));
    
    // Group by participant
    const byParticipant: Record<string, {
      participantId: string;
      answers: Answer[];
      latestTimestamp: Date;
    }> = {};

    relevantAnswers.forEach(ans => {
      if (!byParticipant[ans.participantId]) {
        byParticipant[ans.participantId] = {
          participantId: ans.participantId,
          answers: [],
          latestTimestamp: new Date(ans.timestamp)
        };
      }
      byParticipant[ans.participantId].answers.push(ans);
      const ansDate = new Date(ans.timestamp);
      if (ansDate > byParticipant[ans.participantId].latestTimestamp) {
        byParticipant[ans.participantId].latestTimestamp = ansDate;
      }
    });

    const result = Object.values(byParticipant).map(sub => {
      const p = participants.find(part => part.id === sub.participantId);
      return {
        participant: p,
        ...sub
      };
    }).filter(sub => sub.participant);

    // Sort by timestamp (oldest first - first come first serve)
    result.sort((a, b) => a.latestTimestamp.getTime() - b.latestTimestamp.getTime());

    return result;
  }, [activeQuestions, answers, participants]);

  const getFormattedAnswers = (subAnswers: Answer[]) => {
    return activeQuestions.map((q, index) => {
      const ans = subAnswers.find(a => a.questionId === q.id);
      if (!ans) return null;
      
      const optIndex = q.options?.findIndex(opt => opt === ans.answer) ?? -1;
      const letter = optIndex >= 0 ? String.fromCharCode(65 + optIndex) : '?';
      
      return `${index + 1}.${letter}`;
    }).filter(Boolean).join(', ');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Active Questions</h2>
          <p className="text-slate-500 mt-1">Monitor real-time participant responses</p>
        </div>
      </div>

      {activeQuestions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Active Questions Found</h3>
          <p className="text-slate-500">There are no currently active questions.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeQuestions.map((q, qIndex) => (
              <div key={q.id} className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">Q{qIndex + 1}</span>
                  {q.endTime && <CountdownTimer endTime={q.endTime} date={q.date} />}
                </div>
                <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-3">{q.text}</h4>
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="uppercase tracking-wider">{q.type} • {q.points} pts</span>
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                    <Users className="w-3 h-3" />
                    {answers.filter(a => a.questionId === q.id).length} / {participants.length}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center mt-6">
              <Activity className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">No Submissions Yet</h3>
              <p className="text-slate-500">Wait for participants to submit their answers.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="bg-slate-50 border-b border-slate-200 p-4 md:p-6 flex flex-wrap items-center gap-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Live Submissions Ranking
                </h3>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-slate-200 px-2.5 py-1 rounded-full ml-auto">
                  <Users className="w-4 h-4" />
                  {submissions.length} / {participants.length} Answered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-6 font-semibold w-20 text-center">Rank</th>
                      <th className="py-3 px-6 font-semibold">Participant</th>
                      <th className="py-3 px-6 font-semibold">Answers</th>
                      <th className="py-3 px-6 font-semibold text-right">Submission Time</th>
                      <th className="py-3 px-6 font-semibold text-center w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub, index) => (
                      <tr key={sub.participantId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-6 text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto shadow-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            'bg-slate-50 text-slate-500 border border-slate-100'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                              {sub.participant!.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{sub.participant!.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {sub.participant!.uniqueId || '---'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold tracking-wide text-sm border border-indigo-100 whitespace-nowrap">
                            {getFormattedAnswers(sub.answers)}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <span className="text-sm font-medium text-slate-600">
                            {sub.latestTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this response?')) {
                                deleteParticipantAnswers(sub.participantId, activeQuestions.map(q => q.id));
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Response"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
