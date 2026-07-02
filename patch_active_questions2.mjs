import fs from 'fs';
let content = fs.readFileSync('src/views/ActiveQuestions.tsx', 'utf8');

content = content.replace('Share2, Zap', 'Share2, Zap, Power');

content = content.replace(
  `<div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Users className="w-3 h-3" />
                          {answers.filter(a => a.questionId === q.id).length} / {participants.length}
                        </span>
                      </div>`,
  `<div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Users className="w-3 h-3" />
                          {answers.filter(a => a.questionId === q.id).length} / {participants.length}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-xs font-semibold text-slate-600">Status</span>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to deactivate this question? It will be moved to past questions.')) {
                              updateQuestion(q.id, { status: 'past', isActivatedNow: false });
                            }
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors"
                        >
                          <Power className="w-3 h-3" /> Deactivate
                        </button>
                      </div>`
);

content = content.replace(
  `<span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                  <Users className="w-3 h-3" />
                                  {answers.filter(a => a.questionId === q.id).length} / {participants.length}
                                </span>
                                <div className="flex items-center gap-1">`,
  `<span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                  <Users className="w-3 h-3" />
                                  {answers.filter(a => a.questionId === q.id).length} / {participants.length}
                                </span>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Deactivate this question?')) {
                                      updateQuestion(q.id, { status: 'past', isActivatedNow: false });
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                  title="Deactivate"
                                >
                                  <Power className="w-3 h-3" />
                                </button>
                                <div className="flex items-center gap-1">`
);

fs.writeFileSync('src/views/ActiveQuestions.tsx', content);
console.log('Replaced');
