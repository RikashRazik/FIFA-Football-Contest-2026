import { Question } from './types';

export const COUNTRIES = [
  'Argentina', 'Algeria', 'Australia', 'Austria', 'Belgium', 
  'Bosnia and Herzegovina', 'Brazil', 'Canada', 'Cape Verde', 
  'Colombia', 'Croatia', 'DR Congo', 'Ecuador', 'Egypt', 
  'England', 'France', 'Germany', 'Ghana', 'Iran', 'Ivory Coast', 
  'Japan', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 
  'Norway', 'Paraguay', 'Portugal', 'Scotland', 'Senegal', 
  'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 
  'United States', 'Uzbekistan'
];

export const isQuestionTimedOut = (q: Question) => {
  if (q.status === 'past' || q.isEvaluated) return true;
  
  const today = new Date().toISOString().split('T')[0];
  
  if (q.date < today) return true;
  if (q.date > today) return false;
  
  if (!q.endTime) return false;
  
  try {
    const endDateTime = new Date(q.endTime.includes('T') ? q.endTime : `${q.date}T${q.endTime}`);
    if (isNaN(endDateTime.getTime())) return false;
    return new Date() > endDateTime;
  } catch {
    return false;
  }
};

export const getDynamicQuestionStatus = (q: Question): 'upcoming' | 'active' | 'past' => {
  if (q.status === 'past' || q.isEvaluated) return 'past';
  if (q.isActivatedNow) return 'active';
  
  const today = new Date().toISOString().split('T')[0];
  
  if (q.date > today) return 'upcoming';
  
  return 'active';
};
