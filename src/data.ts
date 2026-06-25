import { Participant, Question } from './types';

const INITIAL_DATA = [
  { name: "mujeeb", total: 22, scores: [0, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 2] },
  { name: "ivin", total: 21, scores: [1, 2, 2, 3, 1, 2, 2, 1, 2, 1, 2, 1, 0, 1] },
  { name: "manir", total: 21, scores: [1, 2, 1, 2, 1, 0, 2, 2, 3, 1, 0, 2, 1, 3] },
  { name: "prajith", total: 21, scores: [0, 0, 1, 3, 1, 2, 2, 2, 2, 1, 1, 3, 0, 3] },
  { name: "askar", total: 20, scores: [1, 1, 2, 2, 1, 1, 1, 2, 1, 2, 1, 1, 2, 2] },
  { name: "savad", total: 20, scores: [1, 1, 1, 2, 1, 0, 2, 2, 2, 2, 1, 2, 0, 3] },
  { name: "shanoob", total: 20, scores: [1, 1, 1, 2, 1, 1, 2, 2, 2, 2, 0, 3, 0, 2] },
  { name: "basil", total: 19, scores: [0, 2, 2, 2, 1, 0, 1, 1, 2, 2, 2, 1, 1, 2] },
  { name: "nameer", total: 19, scores: [1, 2, 0, 3, 1, 2, 2, 2, 3, 0, 0, 2, 0, 1] },
  { name: "rikash", total: 19, scores: [1, 0, 1, 3, 1, 1, 2, 2, 2, 1, 0, 3, 0, 2] },
  { name: "shaani", total: 19, scores: [0, 0, 1, 2, 1, 2, 1, 2, 2, 2, 1, 3, 0, 2] },
  { name: "appunni", total: 18, scores: [1, 2, 2, 3, 0, 1, 1, 2, 1, 0, 0, 3, 1, 1] },
  { name: "baiju", total: 18, scores: [1, 1, 0, 3, 1, 0, 2, 3, 1, 1, 0, 3, 1, 1] },
  { name: "fabeer", total: 18, scores: [0, 1, 2, 0, 1, 0, 2, 2, 3, 2, 0, 3, 0, 2] },
  { name: "ajmal", total: 17, scores: [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 2, 2, 2] },
  { name: "ashique", total: 17, scores: [0, 0, 3, 3, 1, 0, 2, 2, 2, 0, 0, 2, 0, 2] },
  { name: "hijas", total: 17, scores: [0, 0, 0, 2, 1, 2, 2, 2, 3, 2, 1, 1, 1, 0] },
  { name: "justin", total: 17, scores: [1, 0, 1, 1, 1, 0, 2, 3, 3, 1, 0, 2, 0, 2] },
  { name: "thanweer", total: 16, scores: [0, 1, 1, 2, 1, 0, 2, 2, 3, 0, 0, 1, 1, 2] },
  { name: "thariq", total: 16, scores: [0, 2, 1, 3, 1, 0, 1, 2, 2, 2, 0, 1, 1, 0] },
  { name: "sanjesh", total: 15, scores: [0, 0, 0, 0, 0, 1, 2, 2, 2, 1, 1, 2, 1, 3] },
  { name: "praveen", total: 11, scores: [0, 0, 0, 0, 1, 2, 1, 2, 2, 0, 1, 1, 0, 1] },
  { name: "shameed", total: 11, scores: [0, 0, 1, 2, 0, 1, 3, 1, 2, 0, 0, 1, 0, 0] },
  { name: "rony", total: 10, scores: [0, 0, 0, 2, 1, 2, 1, 2, 0, 0, 0, 2, 0, 0] },
  { name: "shibili", total: 10, scores: [0, 1, 0, 0, 0, 0, 1, 1, 0, 2, 0, 3, 0, 2] },
  { name: "prajeesh", total: 9, scores: [0, 1, 0, 1, 1, 0, 0, 2, 0, 0, 1, 1, 0, 2] },
  { name: "midhlaj", total: 5, scores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 2] },
  { name: "vishnu", total: 3, scores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2] },
  { name: "jessin", total: 1, scores: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "midhun", total: 1, scores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] }
];

export const INITIAL_PARTICIPANTS: Participant[] = INITIAL_DATA.map((data) => ({
  id: data.name.toLowerCase(),
  name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
  dailyPoints: data.total,
  bonusPoints: 0,
  bumperPoints: 0,
  dailyScores: data.scores
}));

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "Which team will score the first goal of the tournament?",
    type: "daily",
    points: 1,
    date: "2026-06-11",
    options: ["Team A", "Team B", "No goals"]
  },
  {
    id: "q2",
    text: "Will there be a red card in the opening match?",
    type: "bonus",
    points: 2,
    date: "2026-06-11",
    options: ["Yes", "No"]
  },
  {
    id: "q3",
    text: "Who will win the Golden Boot?",
    type: "bumper",
    points: 5,
    date: "2026-06-11",
    options: ["Player X", "Player Y", "Player Z", "Other"]
  },
  {
    id: "q4",
    text: "Will there be a penalty in the match?",
    type: "daily",
    points: 1,
    date: "2026-06-12",
    options: ["Yes", "No"]
  }
];


