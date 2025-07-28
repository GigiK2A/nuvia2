import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CodePreview from './CodePreview';

interface CodeTab {
  id: number;
  title: string;
  code: string;
}

interface CodeTabsProps {
  tabs: CodeTab[];
  setTabs: React.Dispatch<React.SetStateAction<CodeTab[]>>;
}

export default function CodeTabs({ tabs, setTabs }: CodeTabsProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  // Set active tab when new tabs are added
  useEffect(() => {
    if (tabs.length > 0 && !activeId) {
      setActiveId(tabs[tabs.length - 1].id);
    } else if (tabs.length > 0 && !tabs.find(t => t.id === activeId)) {
      setActiveId(tabs[0].id);
    }
  }, [tabs, activeId]);

  const closeTab = (id: number) => {
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    
    if (activeId === id) {
      if (newTabs.length > 0) {
        setActiveId(newTabs[newTabs.length - 1].id);
      } else {
        setActiveId(null);
      }
    }
  };

  const activeTab = tabs.find((t) => t.id === activeId);

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">💻</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Nessun codice generato</h3>
            <p className="text-sm">Inizia una conversazione per vedere il codice qui</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b bg-gray-50 px-2 py-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-t text-sm cursor-pointer border transition-colors min-w-max ${
              activeId === tab.id 
                ? 'bg-white border-gray-200 border-b-white text-gray-800' 
                : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="truncate max-w-32">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <CodePreview code={activeTab.code} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📝</div>
              <p>Seleziona un tab per visualizzare il codice</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { CodeTab };