import fs from 'fs';

let content = fs.readFileSync('src/views/ActiveQuestions.tsx', 'utf8');

const statePattern = `const [selectedQuestionIdForShare, setSelectedQuestionIdForShare] = useState<string | undefined>(undefined);`;
const stateReplacement = `const [selectedQuestionIdForShare, setSelectedQuestionIdForShare] = useState<string | undefined>(undefined);
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

const click1Pattern = `onClick={() => setSelectedSubmissionsGroup(q.groupId || q.id)}`;
const click1Replacement = `onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      setSelectedSubmissionsGroup(q.groupId || q.id);
                    }}`;
content = content.replace(click1Pattern, click1Replacement);

const click2Pattern = `onClick={() => setSelectedSubmissionsGroup(group[0].groupId || group[0].id)}`;
const click2Replacement = `onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  setSelectedSubmissionsGroup(group[0].groupId || group[0].id);
                }}`;
content = content.replace(click2Pattern, click2Replacement);

fs.writeFileSync('src/views/ActiveQuestions.tsx', content);
console.log('Replaced ActiveQuestions.tsx state');
