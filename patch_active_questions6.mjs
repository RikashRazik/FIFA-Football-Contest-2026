import fs from 'fs';

let content = fs.readFileSync('src/views/ActiveQuestions.tsx', 'utf8');

const oldUseEffect = `  useEffect(() => {
    if (groupedActiveQuestions.length > 0) {
      const currentExists = groupedActiveQuestions.some(g => (g[0].groupId || g[0].id) === selectedSubmissionsGroup);
      if (!selectedSubmissionsGroup || !currentExists) {
        setSelectedSubmissionsGroup(groupedActiveQuestions[0][0].groupId || groupedActiveQuestions[0][0].id);
      }
    } else {
      setSelectedSubmissionsGroup(null);
    }
  }, [groupedActiveQuestions, selectedSubmissionsGroup]);`;

content = content.replace(oldUseEffect, '');

const newUseEffectInsertionPoint = `  const groupedActiveQuestions = useMemo(() => {
    const groups: Record<string, Question[]> = {};
    const ungrouped: Question[] = [];
    
    const sorted = [...activeQuestions].sort((a, b) => {
      if (a.createdAt && b.createdAt) return a.createdAt - b.createdAt;
      return a.id.localeCompare(b.id);
    });

    sorted.forEach(q => {
      if (q.groupId) {
        if (!groups[q.groupId]) groups[q.groupId] = [];
        groups[q.groupId].push(q);
      } else {
        ungrouped.push(q);
      }
    });

    const result: Question[][] = [];
    sorted.forEach(q => {
      if (q.groupId) {
        if (groups[q.groupId]) {
          result.push(groups[q.groupId]);
          delete groups[q.groupId];
        }
      } else {
        result.push([q]);
      }
    });
    return result;
  }, [activeQuestions]);`;

const replacement = newUseEffectInsertionPoint + `\n\n  useEffect(() => {
    if (groupedActiveQuestions.length > 0) {
      const currentExists = groupedActiveQuestions.some(g => (g[0].groupId || g[0].id) === selectedSubmissionsGroup);
      if (!selectedSubmissionsGroup || !currentExists) {
        setSelectedSubmissionsGroup(groupedActiveQuestions[0][0].groupId || groupedActiveQuestions[0][0].id);
      }
    } else {
      setSelectedSubmissionsGroup(null);
    }
  }, [groupedActiveQuestions, selectedSubmissionsGroup]);`;

content = content.replace(newUseEffectInsertionPoint, replacement);

fs.writeFileSync('src/views/ActiveQuestions.tsx', content);
console.log('Fixed useEffect placement');
