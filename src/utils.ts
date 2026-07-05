import { Question } from './types';
import { getTamperProofDate } from './lib/timeSync';

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

export const isQuestionTimedOut = (q: Question): boolean => {
  if (q.status === 'past' || q.isEvaluated) return true;
  
  const now = getTamperProofDate();
  const today = now.toISOString().split('T')[0];

  // If there's an explicit endTime
  if (q.endTime) {
    try {
      // Handle either full ISO/datetime-local or just HH:MM time
      const timeStr = q.endTime.includes('T') ? q.endTime : `${q.date}T${q.endTime.length === 5 ? q.endTime + ':00' : q.endTime}`;
      const endDateTime = new Date(timeStr);
      if (!isNaN(endDateTime.getTime())) {
        return now > endDateTime;
      }
    } catch {
      return false;
    }
  }

  // If no explicit endTime, we fall back to day boundary (end of the question's scheduled date)
  return q.date < today;
};

export const getDynamicQuestionStatus = (q: Question): 'upcoming' | 'active' | 'past' => {
  if (q.status === 'past' || q.isEvaluated) return 'past';
  
  const now = getTamperProofDate();
  const today = now.toISOString().split('T')[0];

  // Check if upcoming based on startTime
  if (q.startTime) {
    try {
      const timeStr = q.startTime.includes('T') ? q.startTime : `${q.date}T${q.startTime.length === 5 ? q.startTime + ':00' : q.startTime}`;
      const startDateTime = new Date(timeStr);
      if (!isNaN(startDateTime.getTime()) && now < startDateTime) {
        return 'upcoming';
      }
    } catch {}
  } else {
    // Default fallback if no startTime is specified
    if (q.date > today) return 'upcoming';
  }

  // Check if past based on endTime or date
  if (isQuestionTimedOut(q)) {
    return 'past';
  }

  return 'active';
};

