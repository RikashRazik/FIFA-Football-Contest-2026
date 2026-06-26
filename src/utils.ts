import { Question } from './types';

export const isQuestionTimedOut = (q: Question) => {
  if (q.status === 'past') return true;
  if (!q.endTime) return false;
  try {
    const endDateTime = new Date(`${q.date}T${q.endTime}`);
    if (isNaN(endDateTime.getTime())) return false;
    return new Date() > endDateTime;
  } catch {
    return false;
  }
};
