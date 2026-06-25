import { useState, useEffect } from 'react';
import { Participant, Question, Answer } from '../types';
import { INITIAL_PARTICIPANTS, INITIAL_QUESTIONS } from '../data';

export function useAppStore() {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('fifa_participants_v3');
    const parsed = saved ? JSON.parse(saved) : INITIAL_PARTICIPANTS;
    
    // Ensure all participants have a unique 4-digit ID
    let updated = false;
    const mapped = parsed.map((p: Participant) => {
      if (!p.uniqueId) {
        updated = true;
        return { ...p, uniqueId: Math.floor(1000 + Math.random() * 9000).toString() };
      }
      return p;
    });
    
    if (updated) {
      localStorage.setItem('fifa_participants_v3', JSON.stringify(mapped));
    }
    
    return mapped;
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('fifa_questions_v3');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  const [answers, setAnswers] = useState<Answer[]>(() => {
    const saved = localStorage.getItem('fifa_answers_v1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fifa_participants_v3', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('fifa_questions_v3', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('fifa_answers_v1', JSON.stringify(answers));
  }, [answers]);

  const updateParticipantScore = (id: string, category: 'dailyPoints' | 'bonusPoints' | 'bumperPoints', delta: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [category]: Math.max(0, p[category] + delta) };
      }
      return p;
    }));
  };

  const addParticipant = (name: string) => {
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name,
      uniqueId: Math.floor(1000 + Math.random() * 9000).toString(),
      dailyPoints: 0,
      bonusPoints: 0,
      bumperPoints: 0,
      dailyScores: []
    };
    setParticipants(prev => [...prev, newParticipant]);
  };

  const updateParticipantName = (id: string, name: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const updateParticipantDailyScore = (id: string, dayIndex: number, score: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        const newDailyScores = [...(p.dailyScores || [])];
        while (newDailyScores.length <= dayIndex) {
          newDailyScores.push(0);
        }
        newDailyScores[dayIndex] = Math.max(0, score);
        const newDailyPoints = newDailyScores.reduce((sum, s) => sum + s, 0);
        return { ...p, dailyScores: newDailyScores, dailyPoints: newDailyPoints };
      }
      return p;
    }));
  };

  const removeParticipantDailyScore = (id: string, dayIndex: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        const newDailyScores = [...(p.dailyScores || [])];
        newDailyScores.splice(dayIndex, 1);
        const newDailyPoints = newDailyScores.reduce((sum, s) => sum + s, 0);
        return { ...p, dailyScores: newDailyScores, dailyPoints: newDailyPoints };
      }
      return p;
    }));
  };

  const deleteParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const addQuestion = (question: Omit<Question, 'id'>) => {
    const newQ = { ...question, id: Date.now().toString() };
    setQuestions(prev => [newQ, ...prev]);
  };

  const updateQuestion = (id: string, updatedFields: Partial<Omit<Question, 'id'>>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updatedFields } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const addAnswer = (questionId: string, participantId: string, answer: string) => {
    const newAnswer: Answer = {
      id: Date.now().toString(),
      questionId,
      participantId,
      answer,
      timestamp: new Date().toISOString()
    };
    setAnswers(prev => [...prev, newAnswer]);
  };

  return {
    participants,
    questions,
    answers,
    updateParticipantScore,
    addParticipant,
    updateParticipantName,
    updateParticipantDailyScore,
    removeParticipantDailyScore,
    deleteParticipant,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addAnswer
  };
}
