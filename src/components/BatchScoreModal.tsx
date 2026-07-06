import React, { useState } from 'react';
import { Upload, X, FileCode } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { Participant } from '../types';

interface BatchScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onBatchUpdate: (updates: { id: string; scoresMap: Record<number, number> }[]) => void;
}

export function BatchScoreModal({ isOpen, onClose, participants, onBatchUpdate }: BatchScoreModalProps) {
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const updates: { id: string; scoresMap: Record<number, number> }[] = [];
        let notFound = 0;

        for (const row of data) {
          const uniqueId = row['Unique ID'] || row['uniqueId'] || row['Unique Code'];
          const name = row['Name'] || row['name'] || row['User Name'] || row[Object.keys(row)[0]];
          
          let participant: Participant | undefined;
          
          if (uniqueId) {
            participant = participants.find(p => p.uniqueId === uniqueId.trim());
          }
          
          if (!participant && name) {
            participant = participants.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
          }

          if (!participant) {
            notFound++;
            continue;
          }

          const scoresMap: Record<number, number> = {};
          
          // Loop through all keys to find day scores
          Object.keys(row).forEach(key => {
            const trimmedKey = key.trim();
            const matchNum = trimmedKey.match(/^(?:[Dd]ay\s*(\d+)|(\d+))$/);
            if (matchNum) {
              const dayNum = parseInt(matchNum[1] || matchNum[2], 10);
              if (dayNum > 0) {
                const score = parseInt(row[key], 10);
                if (!isNaN(score)) {
                  scoresMap[dayNum - 1] = score; // 0-indexed day index
                }
              }
            }
          });
          
          if (Object.keys(scoresMap).length > 0) {
            updates.push({ id: participant.id, scoresMap });
          }
        }

        if (updates.length > 0) {
          onBatchUpdate(updates);
          if (notFound > 0) {
            toast.success(`Successfully queued ${updates.length} users. ${notFound} names not found.`);
          }
          onClose();
        } else {
          toast.error('No valid scores found to update.');
        }
      },
      error: () => {
        toast.error('Failed to parse file');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-none overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-500" /> Batch Update Scores
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Upload a CSV file containing participant scores. The file should include a <span className="font-semibold">"Unique ID"</span> or <span className="font-semibold">"Name"</span> column, and columns named <span className="font-semibold">"Day 1"</span>, <span className="font-semibold">"Day 2"</span>, etc.
          </p>
          
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
            <FileCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <input 
              type="file" 
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>
          
          {file && (
             <p className="text-sm text-indigo-600 font-medium text-center">Selected: {file.name}</p>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleImport} disabled={!file} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50">
            Apply Updates
          </button>
        </div>
      </div>
    </div>
  );
}
