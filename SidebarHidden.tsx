import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home, MessageSquare, FileText, Code, Folder, Calendar, User, X, LogOut, Download, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const sidebarItems = [
  { name: 'Chat Agente', icon: MessageSquare, path: '/' },
  { name: 'Documenti', icon: FileText, path: '/document' },
  { name: 'Codice', icon: Code, path: '/code' },
  { name: 'Progetti', icon: Folder, path: '/projects' },
  { name: 'Calendario', icon: Calendar, path: '/calendar' },
  { name: 'Nuvia', icon: User, path: '/nuvia' },
];

export default function SidebarHidden() {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();
  const [exportLoading, setExportLoading] = useState(false);
  const { toast } = useToast();

  const toggleSidebar = () => setVisible(!visible);

  const handleItemClick = () => {
    setVisible(false);
  };

  const handleExportProject = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/export-project', {
        method: 'GET',
        headers: {
          'Accept': 'application/zip, application/octet-stream',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
      }

      // Verifica che il content-type sia corretto
      const contentType = response.headers.get('content-type');
      console.log('Content-Type ricevuto:', contentType);
      
      const blob = await response.blob();
      console.log('Blob ricevuto:', blob.size, 'bytes, tipo:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('File ZIP ricevuto è vuoto');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nuvia-project-export.zip';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: "Esportazione completata",
        description: `Progetto esportato con successo (${(blob.size / 1024).toFixed(1)} KB)`,
      });
      
      setVisible(false);
    } catch (error) {
      console.error('Errore completo esportazione:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile esportare il progetto",
        variant: "destructive",
      });
    }
    setExportLoading(false);
  };

  return (
    <>
      {/* Hamburger Button - Hidden when sidebar is open */}
      {!visible && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-30 space-card p-3 nebula-glow hover:scale-105 transition-all duration-300"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setVisible(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {visible && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full w-60 space-card z-50 flex flex-col justify-between"
          >
            {/* Main Navigation */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold stellar-text">AI Assistant</h2>
                <button
                  onClick={() => setVisible(false)}
                  className="p-2 rounded-full hologram-effect hover:scale-110 transition-all duration-200"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <nav className="space-y-2">
                {sidebarItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  
                  return (
                    <Link key={idx} href={item.path}>
                      <button
                        onClick={handleItemClick}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                          isActive 
                            ? 'space-button text-primary-foreground font-medium nebula-glow' 
                            : 'text-foreground hover:bg-secondary/50 quantum-border'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </button>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom User Section */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              {/* Export Project Button */}
              <button
                onClick={handleExportProject}
                disabled={exportLoading}
                className="flex items-center gap-2 w-full text-blue-600 hover:text-blue-700 text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exportLoading ? 'Esportando...' : 'Esporta Progetto'}
              </button>
              
              <Link href="/dashboard">
                <button
                  onClick={handleItemClick}
                  className="flex items-center gap-2 w-full text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  Profilo Utente
                </button>
              </Link>
              
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('authToken');
                  window.location.href = '/';
                  handleItemClick();
                }}
                className="flex items-center gap-2 w-full text-red-600 hover:text-red-700 text-sm transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}