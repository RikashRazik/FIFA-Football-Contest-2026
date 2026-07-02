import fs from 'fs';
const content = fs.readFileSync('src/views/ActiveQuestions.tsx', 'utf8');

const targetStr = `<div className="w-full">
            <div className="bg-white rounded-xl border border-indigo-200 p-1 shadow-sm relative overflow-hidden flex flex-col justify-between h-full group">`;

const replaceStr = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groupedActiveQuestions.map((group, groupIdx) => {
              if (group.length === 1) {
                const q = group[0];
                const qIndex = groupIdx;
                return (
                  <div key={q.id} className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between h-full">
                    <div>
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">Q{qIndex + 1}</span>
                        {q.endTime && <CountdownTimer endTime={q.endTime} date={q.date} />}
                      </div>
                      {q.title && (
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded mb-1.5 inline-block">
                          {q.title}
                        </div>
                      )}
                      <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-3">{q.text}</h4>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-4">
                        <span className="uppercase tracking-wider">{q.type} • {q.points} pts</span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Users className="w-3 h-3" />
                          {answers.filter(a => a.questionId === q.id).length} / {participants.length}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            setSelectedQuestionIdForShare(q.id);
                            setShareModalType('question');
                            setIsShareModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                          title="Share this specific question"
                        >
                          <Share2 className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => startEditing(q)}
                          className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-indigo-100/50"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit Question
                        </button>
                        <button 
                          onClick={() => setQuestionToDelete(q)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Group container
              return (
                <div key={group[0].groupId} className="bg-white rounded-xl border border-indigo-200 p-1 shadow-sm relative overflow-hidden flex flex-col justify-between h-full group col-span-1">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                  <div className="bg-indigo-50/50 rounded-lg p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded border border-indigo-200">
                          Group: {group.length} Questions
                        </span>
                        {group[0].title && (
                           <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 truncate max-w-[150px]">
                             {group[0].title}
                           </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {group[0].endTime && <CountdownTimer endTime={group[0].endTime} date={group[0].date} />}
                        <button 
                          onClick={() => {
                            setSelectedGroupIdForShare(group[0].groupId);
                            setShareModalType('group' as any);
                            setIsShareModalOpen(true);
                          }}
                          className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-200 shadow-sm"
                          title="Share these questions"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 flex-1">
                      {group.map((q, idx) => {
                        return (
                          <div key={q.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0 mt-0.5">Q{idx + 1}</span>
                              <h4 className="font-semibold text-slate-700 text-sm leading-tight flex-1">{q.text}</h4>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mt-3 pl-8">
                              <span className="uppercase tracking-wider">{q.type} • {q.points} pts</span>
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                  <Users className="w-3 h-3" />
                                  {answers.filter(a => a.questionId === q.id).length} / {participants.length}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => startEditing(q)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit"><Pencil className="w-3 h-3" /></button>
                                  <button onClick={() => setQuestionToDelete(q)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}`;

const endTarget = `</div>
          </div>

          {submissions.length === 0 ? (`;

const splitByStart = content.split(targetStr);
const splitByEnd = splitByStart[1].split(endTarget);

const newContent = splitByStart[0] + replaceStr + '\n          </div>\n\n          {submissions.length === 0 ? (' + splitByEnd[1];

fs.writeFileSync('src/views/ActiveQuestions.tsx', newContent);
console.log('Replaced');
