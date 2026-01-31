'use client';

import { FileText, Clock } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
           Reports & Export
         </h1>
         <p className="text-gray-400 mt-1">Download result sheets and statistical reports.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 border border-gray-800 rounded-3xl relative overflow-hidden">
         {/* Background Glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

         <div className="p-8 bg-gray-900 border border-gray-800 rounded-full mb-6 shadow-2xl shadow-purple-900/20 relative animate-pulse">
            <Clock size={64} className="text-purple-400" />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 p-2 rounded-full border-4 border-gray-900">
                <FileText size={24} className="text-white" />
            </div>
         </div>
         
         <h2 className="text-3xl font-bold text-white mb-3 text-center">Coming Soon</h2>
         <p className="text-gray-400 text-center max-w-md">
            We are working hard to bring you detailed reporting features. 
            Detailed PDF exports and Excel sheets will be available here shortly.
         </p>
         
         <div className="mt-8 flex gap-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-purple-500/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
            ))}
         </div>
      </div>
    </div>
  );
}
