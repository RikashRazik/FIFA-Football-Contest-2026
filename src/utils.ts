import { Question } from './types';

export const isQuestionTimedOut = (q: Question) => {
  if (q.status === 'past' || q.isEvaluated) return true;
  
  const today = new Date().toISOString().split('T')[0];
  
  if (q.date < today) return true;
  if (q.date > today) return false;
  
  if (!q.endTime) return false;
  
  try {
    const endDateTime = new Date(`${q.date}T${q.endTime}`);
    if (isNaN(endDateTime.getTime())) return false;
    return new Date() > endDateTime;
  } catch {
    return false;
  }
};

export const getDynamicQuestionStatus = (q: Question): 'upcoming' | 'active' | 'past' => {
  if (q.status === 'past' || q.isEvaluated) return 'past';
  
  const today = new Date().toISOString().split('T')[0];
  
  if (q.date > today) return 'upcoming';
  
  return 'active';
};
