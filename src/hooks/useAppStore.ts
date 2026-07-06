import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Participant, Question, Answer, AppSettings } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { getTamperProofDate } from '../lib/timeSync';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useAppStore() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ isPublicLeaderboardEnabled: true });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  useEffect(() => {
    // Migration & listeners setup
    const initializeFirebaseData = async () => {
      try {
        const participantsSnap = await getDocs(collection(db, 'participants'));
        if (participantsSnap.empty) {
          // Migrate from localStorage
          const savedParticipants = localStorage.getItem('fifa_participants_v3');
          if (savedParticipants) {
            const parsed = JSON.parse(savedParticipants);
            const batch = writeBatch(db);
            parsed.forEach((p: Participant) => {
              const id = p.id || Date.now().toString() + Math.random();
              batch.set(doc(db, 'participants', id), { ...p, id });
            });
            await batch.commit();
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'participants');
      }

      try {
        const questionsSnap = await getDocs(collection(db, 'questions'));
        if (questionsSnap.empty) {
          const savedQuestions = localStorage.getItem('fifa_questions_v3');
          if (savedQuestions) {
            const parsed = JSON.parse(savedQuestions);
            const batch = writeBatch(db);
            parsed.forEach((q: Question) => {
              const id = q.id || Date.now().toString() + Math.random();
              batch.set(doc(db, 'questions', id), { ...q, id });
            });
            await batch.commit();
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'questions');
      }

      try {
        const answersSnap = await getDocs(collection(db, 'answers'));
        if (answersSnap.empty) {
          const savedAnswers = localStorage.getItem('fifa_answers_v1');
          if (savedAnswers) {
            const parsed = JSON.parse(savedAnswers);
            const batch = writeBatch(db);
            parsed.forEach((a: Answer) => {
              const id = a.id || Date.now().toString() + Math.random();
              batch.set(doc(db, 'answers', id), { ...a, id });
            });
            await batch.commit();
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'answers');
      }
    };

    initializeFirebaseData()
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });

    const unsubParticipants = onSnapshot(collection(db, 'participants'), { includeMetadataChanges: true }, (snap) => {
      setParticipants(snap.docs.map(d => ({ ...d.data(), id: d.id } as Participant)));
      setIsSyncing(snap.metadata.hasPendingWrites);
      setLastSyncTime(Date.now());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'participants');
    });

    const unsubQuestions = onSnapshot(collection(db, 'questions'), { includeMetadataChanges: true }, (snap) => {
      setQuestions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Question)).sort((a, b) => {
        // preserve sorting
        return a.date.localeCompare(b.date) || a.text.localeCompare(b.text);
      }));
      setIsSyncing(prev => prev || snap.metadata.hasPendingWrites);
      setLastSyncTime(Date.now());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'questions');
    });

    const unsubAnswers = onSnapshot(collection(db, 'answers'), { includeMetadataChanges: true }, (snap) => {
      setAnswers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Answer)));
      setIsSyncing(prev => prev || snap.metadata.hasPendingWrites);
      setLastSyncTime(Date.now());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'answers');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'appSettings'), { includeMetadataChanges: true }, (snap) => {
      if (snap.exists()) {
        setAppSettings(snap.data() as AppSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings');
    });

    return () => {
      unsubParticipants();
      unsubQuestions();
      unsubAnswers();
      unsubSettings();
    };
  }, []);

  const forceRefresh = async () => {
    setIsSyncing(true);
    try {
      const [pSnap, qSnap, aSnap, sSnap] = await Promise.all([
        getDocs(collection(db, 'participants')),
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'answers')),
        getDoc(doc(db, 'settings', 'appSettings'))
      ]);
      
      setParticipants(pSnap.docs.map(d => ({ ...d.data(), id: d.id } as Participant)));
      
      setQuestions(qSnap.docs.map(d => ({ ...d.data(), id: d.id } as Question)).sort((a, b) => {
        return a.date.localeCompare(b.date) || a.text.localeCompare(b.text);
      }));
      
      setAnswers(aSnap.docs.map(d => ({ ...d.data(), id: d.id } as Answer)));

      if (sSnap.exists()) {
        setAppSettings(sSnap.data() as AppSettings);
      }
      setLastSyncTime(Date.now());
    } catch (err) {
      console.error("Force refresh failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateAppSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const docRef = doc(db, 'settings', 'appSettings');
      await setDoc(docRef, newSettings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
    }
  };

  const updateParticipantScore = async (id: string, category: 'dailyPoints' | 'bonusPoints' | 'bumperPoints', delta: number, dayIndex?: number) => {
    try {
      const docRef = doc(db, 'participants', id);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) return;
        const participant = snap.data() as Participant;
        
        const updates: any = {};
        if (category === 'dailyPoints' && dayIndex !== undefined) {
          const newDailyScores = [...(participant.dailyScores || [])];
          while (newDailyScores.length <= dayIndex) {
            newDailyScores.push(0);
          }
          newDailyScores[dayIndex] = Math.max(0, (newDailyScores[dayIndex] || 0) + delta);
          updates.dailyScores = newDailyScores;
          updates.dailyPoints = newDailyScores.reduce((sum, s) => sum + s, 0);

          const manualDailyScores = { ...(participant.manualDailyScores || {}) };
          manualDailyScores[dayIndex.toString()] = true;
          updates.manualDailyScores = manualDailyScores;
        } else {
          updates[category] = Math.max(0, (participant[category] || 0) + delta);
          if (category === 'bonusPoints') {
            updates.manualBonusPoints = true;
          } else if (category === 'bumperPoints') {
            updates.manualBumperPoints = true;
          }
        }
        
        transaction.update(docRef, updates);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'participants');
    }
  };

  const addParticipant = async (name: string, customUniqueId?: string): Promise<string | undefined> => {
    try {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
      const uniqueId = customUniqueId || Math.floor(1000 + Math.random() * 9000).toString();
      const newParticipant: Participant = {
        id,
        name,
        uniqueId,
        dailyPoints: 0,
        bonusPoints: 0,
        bumperPoints: 0,
        dailyScores: [],
        manualDailyScores: {}
      };
      await setDoc(doc(db, 'participants', id), newParticipant);
      return uniqueId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'participants');
    }
  };

  const updateParticipantName = async (id: string, name: string) => {
    try {
      const docRef = doc(db, 'participants', id);
      await updateDoc(docRef, { name });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'participants');
    }
  };

  const updateParticipantDailyScore = async (id: string, dayIndex: number, score: number) => {
    try {
      const docRef = doc(db, 'participants', id);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) return;
        const participant = snap.data() as Participant;
        
        const newDailyScores = [...(participant.dailyScores || [])];
        while (newDailyScores.length <= dayIndex) {
          newDailyScores.push(0);
        }
        newDailyScores[dayIndex] = Math.max(0, score);
        const newDailyPoints = newDailyScores.reduce((sum, s) => sum + s, 0);

        const manualDailyScores = { ...(participant.manualDailyScores || {}) };
        manualDailyScores[dayIndex.toString()] = true;

        transaction.update(docRef, { 
          dailyScores: newDailyScores, 
          dailyPoints: newDailyPoints,
          manualDailyScores
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'participants');
    }
  };

  const batchUpdateParticipantScores = async (updates: { id: string, scoresMap: Record<number, number> }[]) => {
    try {
      const batch = writeBatch(db);
      for (const update of updates) {
        const docRef = doc(db, 'participants', update.id);
        const p = participants.find(part => part.id === update.id);
        
        const existingScores = [...(p?.dailyScores || [])];
        const manualDailyScores = { ...(p?.manualDailyScores || {}) };
        
        Object.entries(update.scoresMap).forEach(([dayIdxStr, score]) => {
          const dayIdx = parseInt(dayIdxStr, 10);
          while (existingScores.length <= dayIdx) {
            existingScores.push(0);
          }
          existingScores[dayIdx] = score;
          manualDailyScores[dayIdx.toString()] = true;
        });

        const newDailyPoints = existingScores.reduce((sum, s) => sum + s, 0);

        batch.update(docRef, { 
          dailyScores: existingScores, 
          dailyPoints: newDailyPoints,
          manualDailyScores
        });
      }
      await batch.commit();
      toast.success(`Successfully batch updated ${updates.length} participants.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'participants');
    }
  };

  const removeParticipantDailyScore = async (id: string, dayIndex: number) => {
    try {
      const docRef = doc(db, 'participants', id);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) return;
        const participant = snap.data() as Participant;
        
        const newDailyScores = [...(participant.dailyScores || [])];
        if (dayIndex >= 0 && dayIndex < newDailyScores.length) {
          newDailyScores.splice(dayIndex, 1);
        }
        const newDailyPoints = newDailyScores.reduce((sum, s) => sum + s, 0);

        const manualDailyScores: Record<string, boolean> = {};
        if (participant.manualDailyScores) {
          Object.entries(participant.manualDailyScores).forEach(([key, value]) => {
            const idx = parseInt(key, 10);
            if (idx < dayIndex) {
              manualDailyScores[key] = value;
            } else if (idx > dayIndex) {
              manualDailyScores[(idx - 1).toString()] = value;
            }
          });
        }

        transaction.update(docRef, { 
          dailyScores: newDailyScores, 
          dailyPoints: newDailyPoints,
          manualDailyScores
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'participants');
    }
  };

  const deleteParticipant = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'participants', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'participants');
    }
  };

  const addQuestion = async (question: Omit<Question, 'id'>) => {
    try {
      const id = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
      const newQ = { ...question, id };
      await setDoc(doc(db, 'questions', id), newQ);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'questions');
    }
  };

  const updateQuestion = async (id: string, updatedFields: Partial<Omit<Question, 'id'>>) => {
    try {
      const docRef = doc(db, 'questions', id);
      await updateDoc(docRef, updatedFields);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'questions');
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'questions');
    }
  };

  const addAnswer = async (questionId: string, participantId: string, answer: string) => {
    try {
      const existingAnswer = answers.find(a => a.questionId === questionId && a.participantId === participantId);
      
      if (existingAnswer) {
        await updateDoc(doc(db, 'answers', existingAnswer.id), { answer, timestamp: getTamperProofDate().toISOString() });
      } else {
        // Enforce a deterministic, collision-proof ID at the database level to mathematically prevent duplicate records
        const id = `${participantId}_${questionId}`;
        const newAnswer: Answer = {
          id,
          questionId,
          participantId,
          answer,
          timestamp: getTamperProofDate().toISOString()
        };
        await setDoc(doc(db, 'answers', id), newAnswer);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'answers');
    }
  };

  const updateAnswerPoints = async (updates: { id: string, pointsAwarded: number }[]) => {
    try {
      const batch = writeBatch(db);
      updates.forEach(update => {
        const docRef = doc(db, 'answers', update.id);
        batch.update(docRef, { pointsAwarded: update.pointsAwarded });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'answers');
    }
  };

  const recalculateAllScores = async (silent = false) => {
    try {
      const getDayIndex = (dateString: string) => {
        const start = new Date('2026-06-11T00:00:00Z');
        const target = new Date(dateString + 'T00:00:00Z');
        return Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      };

      const categoryMap: Record<string, 'dailyPoints' | 'bonusPoints' | 'bumperPoints'> = {
        'daily': 'dailyPoints',
        'bonus': 'bonusPoints',
        'bumper': 'bumperPoints',
        'special': 'bonusPoints',
        'multiple_choice': 'bonusPoints'
      };

      // Fetch fresh, authoritative ground-truth data directly from firestore to prevent any race conditions or stale React states
      const [participantsSnap, questionsSnap, answersSnap] = await Promise.all([
        getDocs(collection(db, 'participants')),
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'answers'))
      ]);
      const freshParticipants = participantsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Participant));
      const freshQuestions = questionsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
      const freshAnswers = answersSnap.docs.map(d => ({ ...d.data(), id: d.id } as Answer));

      // Identify which days actually have evaluated daily questions
      const evaluatedDailyDays = new Set<number>();
      freshQuestions.forEach(q => {
        const category = categoryMap[q.type] || 'dailyPoints';
        if (q.isEvaluated && category === 'dailyPoints') {
          evaluatedDailyDays.add(getDayIndex(q.date));
        }
      });

      const hasEvaluatedBonus = freshQuestions.some(q => q.isEvaluated && (categoryMap[q.type] || 'dailyPoints') === 'bonusPoints');
      const hasEvaluatedBumper = freshQuestions.some(q => q.isEvaluated && (categoryMap[q.type] || 'dailyPoints') === 'bumperPoints');

      // Reset scores in memory for a clean sum of evaluated answers
      const evaluatedScoresMap: Record<string, {
        dailyScores: Record<number, number>;
        bonusPoints: number;
        bumperPoints: number;
      }> = {};

      freshParticipants.forEach(p => {
        evaluatedScoresMap[p.id] = {
          dailyScores: {},
          bonusPoints: 0,
          bumperPoints: 0
        };
      });

      // Track which participant has actual answer records for daily/bonus/bumper questions
      const participantDailyAnswerDays = new Map<string, Set<number>>();
      const participantHasBonusAnswer = new Set<string>();
      const participantHasBumperAnswer = new Set<string>();

      // Sum pointsAwarded from all answers
      freshAnswers.forEach(ans => {
        const q = freshQuestions.find(question => question.id === ans.questionId);
        if (!q) return;

        const pts = ans.pointsAwarded ?? 0;
        const category = categoryMap[q.type] || 'dailyPoints';
        const dayIdx = getDayIndex(q.date);

        const scoresObj = evaluatedScoresMap[ans.participantId];
        if (scoresObj) {
          if (category === 'dailyPoints') {
            scoresObj.dailyScores[dayIdx] = (scoresObj.dailyScores[dayIdx] || 0) + pts;
            
            if (!participantDailyAnswerDays.has(ans.participantId)) {
              participantDailyAnswerDays.set(ans.participantId, new Set<number>());
            }
            participantDailyAnswerDays.get(ans.participantId)!.add(dayIdx);
          } else if (category === 'bonusPoints') {
            scoresObj.bonusPoints += pts;
            participantHasBonusAnswer.add(ans.participantId);
          } else if (category === 'bumperPoints') {
            scoresObj.bumperPoints += pts;
            participantHasBumperAnswer.add(ans.participantId);
          }
        }
      });

      // Write updates to Firestore in a batch
      const batch = writeBatch(db);
      freshParticipants.forEach(p => {
        const evalScores = evaluatedScoresMap[p.id];
        if (evalScores) {
          // Merge evaluated scores with existing manual/imported scores
          const existingScores = p.dailyScores || [];
          const manualDailyScores = { ...(p.manualDailyScores || {}) };
          
          // Determine the maximum day index between existing scores and evaluated scores
          const maxExistingDayIdx = existingScores.length - 1;
          const maxEvalDayIdx = Object.keys(evalScores.dailyScores).length > 0 
            ? Math.max(...Object.keys(evalScores.dailyScores).map(Number)) 
            : -1;
          
          const maxDayIdx = Math.max(maxExistingDayIdx, maxEvalDayIdx);

          // Retroactive automatic manual scoring lock/detection:
          // If a user has a score > 0 but NO answer submitted for that day in the database,
          // then this score MUST have been imported or manually entered. We must flag it as manual!
          for (let i = 0; i <= maxDayIdx; i++) {
            const hasUserAnswer = participantDailyAnswerDays.get(p.id)?.has(i);
            const scoreInArray = existingScores[i] || 0;
            if (scoreInArray > 0 && !hasUserAnswer) {
              manualDailyScores[i.toString()] = true;
            }
          }

          let manualBonusPoints = p.manualBonusPoints || false;
          if ((p.bonusPoints || 0) > 0 && !participantHasBonusAnswer.has(p.id)) {
            manualBonusPoints = true;
          }

          let manualBumperPoints = p.manualBumperPoints || false;
          if ((p.bumperPoints || 0) > 0 && !participantHasBumperAnswer.has(p.id)) {
            manualBumperPoints = true;
          }
          
          const dailyScoresArr: number[] = [];
          for (let i = 0; i <= maxDayIdx; i++) {
            // Check if this day is flagged as manually overridden/imported
            const isManuallySet = manualDailyScores[i.toString()] === true;
            
            if (isManuallySet) {
              // This score was manually uploaded or edited! PRESERVE IT EXACTLY.
              dailyScoresArr.push(existingScores[i] || 0);
            } else {
              // Not manually set. ONLY use the evaluated score if the day has evaluated questions AND the participant actually has submitted answers for that day.
              // This prevents overwriting manually entered or imported scores when no answer is present in the database.
              const hasUserAnswer = participantDailyAnswerDays.get(p.id)?.has(i);
              if (evaluatedDailyDays.has(i) && hasUserAnswer) {
                dailyScoresArr.push(evalScores.dailyScores[i] || 0);
              } else {
                dailyScoresArr.push(existingScores[i] || 0);
              }
            }
          }

          const dailyPoints = dailyScoresArr.reduce((sum, s) => sum + s, 0);
          
          // ONLY update bonus or bumper points if they have evaluated bonus/bumper questions AND the user actually has an answer for them,
          // AND they are NOT marked as manually overridden!
          const bonusPoints = manualBonusPoints 
            ? (p.bonusPoints || 0) 
            : ((hasEvaluatedBonus && participantHasBonusAnswer.has(p.id)) 
              ? evalScores.bonusPoints 
              : (p.bonusPoints || 0));
              
          const bumperPoints = manualBumperPoints 
            ? (p.bumperPoints || 0) 
            : ((hasEvaluatedBumper && participantHasBumperAnswer.has(p.id)) 
              ? evalScores.bumperPoints 
              : (p.bumperPoints || 0));

          const docRef = doc(db, 'participants', p.id);
          batch.update(docRef, {
            dailyScores: dailyScoresArr,
            dailyPoints: dailyPoints,
            bonusPoints: bonusPoints,
            bumperPoints: bumperPoints,
            manualDailyScores,
            manualBonusPoints,
            manualBumperPoints
          });
        }
      });

      await batch.commit();
      if (!silent) {
        toast.success('Successfully synchronized and recalculated all participant scores!');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'recalculate');
    }
  };

  const deleteParticipantAnswers = async (answerIds: string[]) => {
    try {
      const batch = writeBatch(db);
      answerIds.forEach(id => {
        batch.delete(doc(db, 'answers', id));
      });
      await batch.commit();
      await recalculateAllScores(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'answers');
    }
  };

  const exportFullState = () => {
    const data = {
      participants,
      questions,
      answers,
      appSettings,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const importFullState = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const { participants: newParticipants, questions: newQuestions, answers: newAnswers, appSettings: newSettings } = parsed;

      const batch = writeBatch(db);

      // We won't delete existing data to be safe, just upsert (set) the imported data.
      // If we need to replace completely, we'd have to query and delete first.
      // Let's do a full replace for data provided in the JSON to be a true "fallback mechanism"
      // Wait, Firestore batch is limited to 500 operations. If there's a lot of data, we need multiple batches.
      
      const commitBatches = async (ops: (() => void)[]) => {
        for (let i = 0; i < ops.length; i += 450) {
          const currentBatch = writeBatch(db);
          ops.slice(i, i + 450).forEach(op => {
             // to execute the batch set/delete, we actually need to pass the batch instance to the operations,
             // or just run them directly.
             // A simpler way:
          });
          // Wait, this is getting complicated.
        }
      };

      // Let's just create chunks of 450 operations
      const allOps: { type: 'set', collection: string, id: string, data: any }[] = [];
      
      if (Array.isArray(newParticipants)) {
        newParticipants.forEach((p: any) => allOps.push({ type: 'set', collection: 'participants', id: p.id, data: p }));
      }
      if (Array.isArray(newQuestions)) {
        newQuestions.forEach((q: any) => allOps.push({ type: 'set', collection: 'questions', id: q.id, data: q }));
      }
      if (Array.isArray(newAnswers)) {
        newAnswers.forEach((a: any) => allOps.push({ type: 'set', collection: 'answers', id: a.id, data: a }));
      }
      if (newSettings) {
        allOps.push({ type: 'set', collection: 'settings', id: 'appSettings', data: newSettings });
      }

      for (let i = 0; i < allOps.length; i += 450) {
        const currentBatch = writeBatch(db);
        const chunk = allOps.slice(i, i + 450);
        chunk.forEach(op => {
          if (op.type === 'set') {
            currentBatch.set(doc(db, op.collection, op.id), op.data);
          }
        });
        await currentBatch.commit();
      }

      toast.success('Database state imported successfully');
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.WRITE, 'import');
    }
  };

  return {
    participants,
    questions,
    answers,
    appSettings,
    isLoading,
    isSyncing,
    lastSyncTime,
    forceRefresh,
    updateAppSettings,
    exportFullState,
    importFullState,
    updateParticipantScore,
    addParticipant,
    updateParticipantName,
    updateParticipantDailyScore,
    batchUpdateParticipantScores,
    removeParticipantDailyScore,
    deleteParticipant,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addAnswer,
    updateAnswerPoints,
    recalculateAllScores,
    deleteParticipantAnswers
  };
}
