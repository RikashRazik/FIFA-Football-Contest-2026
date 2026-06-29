import { useState, useEffect } from 'react';
import { Participant, Question, Answer } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch, getDoc, updateDoc } from 'firebase/firestore';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'participants');
    });

    const unsubQuestions = onSnapshot(collection(db, 'questions'), { includeMetadataChanges: true }, (snap) => {
      setQuestions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Question)).sort((a, b) => {
        // preserve sorting
        return a.date.localeCompare(b.date) || a.text.localeCompare(b.text);
      }));
      setIsSyncing(prev => prev || snap.metadata.hasPendingWrites);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'questions');
    });

    const unsubAnswers = onSnapshot(collection(db, 'answers'), { includeMetadataChanges: true }, (snap) => {
      setAnswers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Answer)));
      setIsSyncing(prev => prev || snap.metadata.hasPendingWrites);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'answers');
    });

    return () => {
      unsubParticipants();
      unsubQuestions();
      unsubAnswers();
    };
  }, []);

  const updateParticipantScore = async (id: string, category: 'dailyPoints' | 'bonusPoints' | 'bumperPoints', delta: number, dayIndex?: number) => {
    try {
      const docRef = doc(db, 'participants', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const participant = snap.data() as Participant;
      const newScore = Math.max(0, (participant[category] || 0) + delta);
      
      const updates: any = { [category]: newScore };
      if (category === 'dailyPoints' && dayIndex !== undefined) {
        const newDailyScores = [...(participant.dailyScores || [])];
        while (newDailyScores.length <= dayIndex) {
          newDailyScores.push(0);
        }
        newDailyScores[dayIndex] = Math.max(0, (newDailyScores[dayIndex] || 0) + delta);
        updates.dailyScores = newDailyScores;
      }
      
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'participants');
    }
  };

  const addParticipant = async (name: string): Promise<string | undefined> => {
    try {
      const id = Date.now().toString();
      const uniqueId = Math.floor(1000 + Math.random() * 9000).toString();
      const newParticipant: Participant = {
        id,
        name,
        uniqueId,
        dailyPoints: 0,
        bonusPoints: 0,
        bumperPoints: 0,
        dailyScores: []
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
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const participant = snap.data() as Participant;
      
      const newDailyScores = [...(participant.dailyScores || [])];
      while (newDailyScores.length <= dayIndex) {
        newDailyScores.push(0);
      }
      newDailyScores[dayIndex] = Math.max(0, score);
      const newDailyPoints = newDailyScores.reduce((sum, s) => sum + s, 0);
      await updateDoc(docRef, { dailyScores: newDailyScores, dailyPoints: newDailyPoints });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'participants');
    }
  };

  const removeParticipantDailyScore = async (id: string, dayIndex: number) => {
    try {
      const docRef = doc(db, 'participants', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const participant = snap.data() as Participant;
      
      const newDailyScores = [...(participant.dailyScores || [])];
      if (dayIndex >= 0 && dayIndex < newDailyScores.length) {
        newDailyScores.splice(dayIndex, 1);
      }
      const newDailyPoints = newDailyScores.reduce((sum, s) => sum + s, 0);
      await updateDoc(docRef, { dailyScores: newDailyScores, dailyPoints: newDailyPoints });
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
      const id = Date.now().toString();
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
        await updateDoc(doc(db, 'answers', existingAnswer.id), { answer, timestamp: new Date().toISOString() });
      } else {
        const id = Date.now().toString();
        const newAnswer: Answer = {
          id,
          questionId,
          participantId,
          answer,
          timestamp: new Date().toISOString()
        };
        await setDoc(doc(db, 'answers', id), newAnswer);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'answers');
    }
  };

  const deleteParticipantAnswers = async (answerIds: string[]) => {
    try {
      const batch = writeBatch(db);
      answerIds.forEach(id => {
        batch.delete(doc(db, 'answers', id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'answers');
    }
  };

  return {
    participants,
    questions,
    answers,
    isLoading,
    isSyncing,
    updateParticipantScore,
    addParticipant,
    updateParticipantName,
    updateParticipantDailyScore,
    removeParticipantDailyScore,
    deleteParticipant,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addAnswer,
    deleteParticipantAnswers
  };
}
