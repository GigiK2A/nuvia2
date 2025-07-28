import { useState, useEffect } from 'react';
import { FileText, Code, Brain, Monitor } from 'lucide-react';

interface MobileTabsProps {
  setView: (view: string) => void;
  currentView: string;
}

const MobileTabs = ({ setView, currentView }: MobileTabsProps) => {
  const tabs = [
    { id: 'File', label: 'File', icon: FileText },
    { id: 'Editor', label: 'Editor', icon: Code },
    { id: 'AI', label: 'AI', icon: Brain },
    { id: 'Preview', label: 'Preview', icon: Monitor }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around py-2 md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
              isActive 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileTabs;