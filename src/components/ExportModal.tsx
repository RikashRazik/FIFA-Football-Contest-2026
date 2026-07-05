import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileSpreadsheet, FileText, FileImage, FileCode } from 'lucide-react';
import { Participant } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
}

type ExportFormat = 'csv' | 'excel' | 'pdf' | 'png';

export function ExportModal({ isOpen, onClose, participants }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
  
  const [fields, setFields] = useState({
    name: true,
    uniqueCode: true,
    dailyPoints: true,
    bonusPoints: true,
    bumperPoints: true,
    totalPoints: true,
    dayWisePoints: true,
  });

  const hiddenTableRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleToggleField = (field: keyof typeof fields) => {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getExportData = () => {
    // Determine max days for day-wise points
    let maxDays = 0;
    if (fields.dayWisePoints) {
      participants.forEach(p => {
        if (p.dailyScores && p.dailyScores.length > maxDays) {
          maxDays = p.dailyScores.length;
        }
      });
    }

    const headers: string[] = [];
    if (fields.name) headers.push('User Name');
    if (fields.uniqueCode) headers.push('Unique Code');
    if (fields.dailyPoints) headers.push('User Points');
    if (fields.bonusPoints) headers.push('Bonus Points');
    if (fields.bumperPoints) headers.push('Bumper Points');
    if (fields.totalPoints) headers.push('Total Points');
    
    if (fields.dayWisePoints) {
      for (let i = 0; i < maxDays; i++) {
        headers.push(`Day ${i + 1}`);
      }
    }

    const rows = participants.map(p => {
      const row: any[] = [];
      if (fields.name) row.push(p.name);
      if (fields.uniqueCode) row.push(p.uniqueId || '-');
      if (fields.dailyPoints) row.push(p.dailyPoints);
      if (fields.bonusPoints) row.push(p.bonusPoints);
      if (fields.bumperPoints) row.push(p.bumperPoints);
      if (fields.totalPoints) row.push(p.dailyPoints + p.bonusPoints + p.bumperPoints);
      
      if (fields.dayWisePoints) {
        for (let i = 0; i < maxDays; i++) {
          row.push(p.dailyScores?.[i] || 0);
        }
      }
      return row;
    });

    return { headers, rows };
  };

  const handleExport = async () => {
    try {
      const { headers, rows } = getExportData();

      if (selectedFormat === 'csv') {
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'participants_export.csv';
        link.click();
      } 
      else if (selectedFormat === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
        XLSX.writeFile(workbook, 'participants_export.xlsx');
      }
      else if (selectedFormat === 'pdf') {
        const doc = new jsPDF();
        autoTable(doc, {
          head: [headers],
          body: rows,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] }
        });
        doc.save('participants_export.pdf');
      }
      else if (selectedFormat === 'png') {
        if (hiddenTableRef.current) {
          hiddenTableRef.current.style.display = 'block';
          const canvas = await html2canvas(hiddenTableRef.current);
          hiddenTableRef.current.style.display = 'none';
          
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = url;
          link.download = 'participants_export.png';
          link.click();
        }
      }
      toast.success('Export successful!');
      onClose();
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Failed to export data.');
    }
  };

  const { headers, rows } = getExportData();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-none overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-500" /> Export Participants
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Fields to Export</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'name', label: 'User Name' },
                  { id: 'uniqueCode', label: 'Unique Code' },
                  { id: 'dailyPoints', label: 'User Points' },
                  { id: 'bonusPoints', label: 'Bonus Points' },
                  { id: 'bumperPoints', label: 'Bumper Points' },
                  { id: 'totalPoints', label: 'Total Points' },
                  { id: 'dayWisePoints', label: 'Day-wise Points' },
                ].map(field => (
                  <label key={field.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={fields[field.id as keyof typeof fields]}
                      onChange={() => handleToggleField(field.id as keyof typeof fields)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Export Format</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { id: 'csv', label: 'CSV', icon: FileCode, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { id: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
                  { id: 'png', label: 'PNG', icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map(format => {
                  const Icon = format.icon;
                  const isSelected = selectedFormat === format.id;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id as ExportFormat)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${format.bg}`}>
                        <Icon className={`w-6 h-6 ${format.color}`} />
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>
                        {format.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!Object.values(fields).some(Boolean)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Data
            </button>
          </div>
          
          {/* Hidden table for PNG export */}
          <div ref={hiddenTableRef} className="absolute -z-10 bg-white p-8 w-[1200px]" style={{ display: 'none', top: -9999, left: -9999 }}>
            <h2 className="text-2xl font-bold mb-4 text-slate-800">Participants Export</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="border border-slate-300 p-2 bg-indigo-50 text-indigo-800 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} className="border border-slate-300 p-2 text-slate-700">{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
