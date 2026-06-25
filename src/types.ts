export type QuestionType = 'daily' | 'bonus' | 'bumper';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  date: string;
  status: 'active' | 'past' | 'upcoming';
  options?: string[];
}

export interface Participant {
  id: string;
  name: string;
  dailyPoints: number;
  bonusPoints: number;
  bumperPoints: number;
  dailyScores?: number[];
}
