const activeQuestions = [
  { id: '1', groupId: 'A', createdAt: 1 },
  { id: '2', groupId: 'A', createdAt: 2 },
  { id: '3', groupId: 'B', createdAt: 3 },
  { id: '4', createdAt: 4 }
];

const groups = {};
const ungrouped = [];

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

const result = [];
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

console.log(JSON.stringify(result));
