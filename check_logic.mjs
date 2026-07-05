import fs from 'fs';
const c = fs.readFileSync('src/hooks/useAppStore.ts', 'utf8');
console.log(c.substring(c.indexOf('updateParticipantScore'), c.indexOf('addParticipant')));
