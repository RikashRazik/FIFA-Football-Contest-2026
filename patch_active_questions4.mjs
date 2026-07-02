import fs from 'fs';

let content = fs.readFileSync('src/views/ActiveQuestions.tsx', 'utf8');

// 1. Add state
const statePattern = `const [selectedQuestionIdForShare, setSelectedQuestionIdForShare] = useState<string | undefined>();`;
const stateReplacement = `const [selectedQuestionIdForShare, setSelectedQuestionIdForShare] = useState<string | undefined>();
  const [selectedSubmissionsGroup, setSelectedSubmissionsGroup] = useState<string | null>(null);

  useEffect(() => {
    if (groupedActiveQuestions.length > 0) {
      const currentExists = groupedActiveQuestions.some(g => (g[0].groupId || g[0].id) === selectedSubmissionsGroup);
      if (!selectedSubmissionsGroup || !currentExists) {
        setSelectedSubmissionsGroup(groupedActiveQuestions[0][0].groupId || groupedActiveQuestions[0][0].id);
      }
    } else {
      setSelectedSubmissionsGroup(null);
    }
  }, [groupedActiveQuestions, selectedSubmissionsGroup]);`;
content = content.replace(statePattern, stateReplacement);

// 2. Modify submissions useMemo
const subMemoPattern = `const submissions = useMemo(() => {
    if (activeQuestions.length === 0) return [];

    const questionIds = activeQuestions.map(q => q.id);`;
const subMemoReplacement = `const { targetQuestions, submissions } = useMemo(() => {
    if (activeQuestions.length === 0) return { targetQuestions: [], submissions: [] };

    let target = activeQuestions;
    if (selectedSubmissionsGroup) {
      const group = groupedActiveQuestions.find(g => (g[0].groupId || g[0].id) === selectedSubmissionsGroup);
      if (group) {
        target = group;
      } else {
        target = groupedActiveQuestions[0] || activeQuestions;
      }
    } else {
      target = groupedActiveQuestions[0] || activeQuestions;
    }

    const questionIds = target.map(q => q.id);`;
content = content.replace(subMemoPattern, subMemoReplacement);

const subMemoEndPattern = `    // Sort by timestamp (oldest first - first come first serve)
    result.sort((a, b) => a.latestTimestamp.getTime() - b.latestTimestamp.getTime());

    return result;
  }, [activeQuestions, answers, participants]);`;
const subMemoEndReplacement = `    // Sort by timestamp (oldest first - first come first serve)
    result.sort((a, b) => a.latestTimestamp.getTime() - b.latestTimestamp.getTime());

    return { targetQuestions: target, submissions: result };
  }, [activeQuestions, answers, participants, selectedSubmissionsGroup, groupedActiveQuestions]);`;
content = content.replace(subMemoEndPattern, subMemoEndReplacement);

// 3. Make containers clickable
const singleQuestionCardPattern = `<div key={q.id} className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between h-full">`;
const singleQuestionCardReplacement = `<div 
                    key={q.id} 
                    onClick={() => setSelectedSubmissionsGroup(q.groupId || q.id)}
                    className={\`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between h-full cursor-pointer \${
                      selectedSubmissionsGroup === (q.groupId || q.id) ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-indigo-100'
                    }\`}
                  >`;
content = content.replace(singleQuestionCardPattern, singleQuestionCardReplacement);

const groupQuestionCardPattern = `<div key={group[0].groupId} className="bg-white rounded-xl border border-indigo-200 p-1 shadow-sm relative overflow-hidden flex flex-col justify-between h-full group col-span-1">`;
const groupQuestionCardReplacement = `<div 
                key={group[0].groupId || group[0].id} 
                onClick={() => setSelectedSubmissionsGroup(group[0].groupId || group[0].id)}
                className={\`bg-white rounded-xl border p-1 shadow-sm relative overflow-hidden flex flex-col justify-between h-full group col-span-1 cursor-pointer \${
                  selectedSubmissionsGroup === (group[0].groupId || group[0].id) ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-indigo-200'
                }\`}
              >`;
content = content.replace(groupQuestionCardPattern, groupQuestionCardReplacement);

// 4. Update table to use targetQuestions instead of activeQuestions
const activeQsMapPattern = `{activeQuestions.map((q, idx) => {`;
const targetQsMapReplacement = `{targetQuestions.map((q, idx) => {`;
content = content.replace(activeQsMapPattern, targetQsMapReplacement);

const lengthCheckPattern = `{activeQuestions.length > 1 && (`;
const lengthCheckReplacement = `{targetQuestions.length > 1 && (`;
content = content.replace(lengthCheckPattern, lengthCheckReplacement);


fs.writeFileSync('src/views/ActiveQuestions.tsx', content);
console.log('Replaced ActiveQuestions.tsx');
