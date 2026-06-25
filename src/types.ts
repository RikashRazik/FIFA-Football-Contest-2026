export type QuestionType = 'daily' | 'bonus' | 'bumper';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  date: string;
  status: 'active' | 'past' | 'upcoming';
  options?: string[];
  endTime?: string;
}

export interface Participant {
  id: string;
  name: string;
  uniqueId?: string;
  dailyPoints: number;
  bonusPoints: number;
  bumperPoints: number;
  dailyScores?: number[];
}

export interface Answer {
  id: string;
  questionId: string;
  participantId: string;
  answer: string;
  timestamp: string;
}
