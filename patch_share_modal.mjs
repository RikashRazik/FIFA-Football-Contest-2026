import fs from 'fs';
let content = fs.readFileSync('src/components/ShareLinkModal.tsx', 'utf8');

const linkPreviewStart = `            <div className="md:col-span-3 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  2. Generated Link Preview
                </label>`;

const linkPreviewContent = `                <div className="space-y-3">
                  {shareType === 'active' && questions && questions.some(q => q.status === 'active' || q.isActivatedNow) ? (
                    (() => {
                      const activeQs = questions.filter(q => q.status === 'active' || q.isActivatedNow);
                      const groups = {};
                      const ungrouped = [];
                      activeQs.forEach(q => {
                        if (q.groupId) {
                          if (!groups[q.groupId]) groups[q.groupId] = [];
                          groups[q.groupId].push(q);
                        } else {
                          ungrouped.push(q);
                        }
                      });
                      
                      const origin = window.location.origin;
                      const pathname = window.location.pathname;
                      
                      const links = [];
                      links.push({
                        title: 'All Active Questions',
                        url: \`\${origin}\${pathname}?active=true\`
                      });
                      
                      Object.values(groups).forEach(grp => {
                         links.push({
                           title: grp[0].title ? \`Group: \${grp[0].title}\` : \`Group (\${grp.length} questions)\`,
                           url: \`\${origin}\${pathname}?groupId=\${grp[0].groupId}\`
                         });
                      });
                      
                      ungrouped.forEach(q => {
                        links.push({
                           title: q.title ? \`\${q.title}: \${q.text}\` : q.text,
                           url: \`\${origin}\${pathname}?questionId=\${q.id}\`
                        });
                      });
                      
                      return links.map((link, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-slate-600 truncate">{link.title}</span>
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 group">
                            <input
                              type="text"
                              readOnly
                              value={link.url}
                              className="flex-1 bg-transparent border-none text-slate-700 font-mono text-xs select-all outline-none pl-2 truncate"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(link.url);
                                toast.success('Link copied!');
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </button>
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 group">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-transparent border-none text-slate-700 font-mono text-xs select-all outline-none pl-2 truncate"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all shrink-0"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>`;

const linkPreviewEnd = `                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-semibold pl-2">
                  <span>🔒 Safe HTTPS Domain</span>`;

const splitStart = content.split(linkPreviewStart);
if (splitStart.length === 2) {
  const splitEnd = splitStart[1].split(linkPreviewEnd);
  
  // We need to carefully remove the original link preview
  const newContent = splitStart[0] + linkPreviewStart + '\n' + linkPreviewContent + '\n' + linkPreviewEnd + splitEnd[1];
  fs.writeFileSync('src/components/ShareLinkModal.tsx', newContent);
  console.log('Replaced');
} else {
  console.log('Could not find start split');
}

