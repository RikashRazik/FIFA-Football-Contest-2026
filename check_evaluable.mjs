import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const getDynamicQuestionStatus = (q) => {
  if (q.status === 'past' || q.isEvaluated) return 'past';
  if (q.isActivatedNow) return 'active';
  
  const today = new Date().toISOString().split('T')[0];
  if (q.date > today) return 'upcoming';
  return 'active';
};

const isQuestionTimedOut = (q) => {
  if (!q.date) return false;
  if (!q.endTime) {
    const today = new Date().toISOString().split('T')[0];
    return q.date < today;
  }
  
  const todayDate = new Date().toISOString().split('T')[0];
  if (q.date < todayDate) return true;
  if (q.date > todayDate) return false;

  const now = new Date();
  const [hours, minutes] = q.endTime.split(':').map(Number);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  
  return now > end;
};


async function run() {
  const qSnap = await getDocs(collection(db, 'questions'));
  const questions = qSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const evaluable = questions.filter(q => getDynamicQuestionStatus(q) === 'active' && !q.isEvaluated && isQuestionTimedOut(q));
  
  console.log(`Found ${evaluable.length} evaluable questions:`);
  for (const q of evaluable) {
    console.log(`- ${q.text} (date: ${q.date}, endTime: ${q.endTime}, status: ${q.status}, isEvaluated: ${q.isEvaluated})`);
  }
}
run().catch(console.error);
