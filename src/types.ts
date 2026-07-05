export type QuestionType = 'daily' | 'bonus' | 'bumper' | 'special' | 'multiple_choice';

export interface Question {
  id: string;
  text: string;
  title?: string;
  type: QuestionType;
  points: number;
  date: string;
  status: 'active' | 'past' | 'upcoming';
  options?: string[];
  endTime?: string;
  startTime?: string;
  isEvaluated?: boolean;
  correctAnswer?: string;
  isManualInput?: boolean;
  manualInputCount?: number;
  manualInputPlaceholders?: string[];
  maxSelections?: number;
  isActivatedNow?: boolean;
  columns?: number;
  isMultipleChoice?: boolean;
  groupId?: string;
  createdAt?: number;
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
  pointsAwarded?: number;
}

export interface AppSettings {
  isPublicLeaderboardEnabled?: boolean;
  isMaintenanceMode?: boolean;
}

