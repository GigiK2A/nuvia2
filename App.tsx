import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ChatAgentFixed from "@/pages/ChatAgentFixed";
import DocumentAgent from "@/pages/DocumentAgent";
import CodeAgent from "@/pages/CodeAgent";
import ProjectGenerator from "@/pages/ProjectGenerator";
import AdminPanel from "@/pages/AdminPanel";
import AdminPage from "@/pages/AdminPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import CalendarPage from "@/pages/CalendarPage";
import CalendarIntegrationPage from "@/pages/CalendarIntegrationPage";
import NuviaPage from "@/pages/NuviaPage";
import CollaborativePage from "@/pages/CollaborativePage";
import SettingsPage from "@/pages/SettingsPage";
import MobileHeader from "@/components/layout/MobileHeader";
import { useState, useEffect } from "react";
import SettingsModal from "@/components/shared/SettingsModal";
import { useIsMobile } from "@/hooks/use-mobile";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SidebarHidden from "@/components/SidebarHidden";
import { useAuth } from "@/hooks/useAuth";


function Router() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen space-grid flex items-center justify-center">
        <div className="text-center space-card p-8">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4 nebula-glow"></div>
          <p className="stellar-text text-lg font-medium">Inizializzazione sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Switch>
      <Route path="/" component={ChatAgentFixed} />
      <Route path="/chat" component={ChatAgentFixed} />
      <Route path="/document" component={DocumentAgent} />
      <Route path="/code" component={CodeAgent} />
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPage} adminOnly={true} />}
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/calendar-integration" component={CalendarIntegrationPage} />
      <Route path="/nuvia">
        {() => <ProtectedRoute component={NuviaPage} adminOnly={false} />}
      </Route>
      <Route path="/assistant">
        {() => <ProtectedRoute component={NuviaPage} adminOnly={false} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} adminOnly={false} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isMobile = useIsMobile();

  // Verifica lo stato di autenticazione
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      console.log('Token trovato:', token ? 'Sì' : 'No');
      setIsAuthenticated(!!token);
    };
    
    checkAuth();
    
    // Listener per cambiamenti nel localStorage (login/logout)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    // Listener per eventi custom di login
    const handleLogin = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('login', handleLogin);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('login', handleLogin);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Global Sidebar - Always Available */}
        {isAuthenticated && <SidebarHidden />}
        
        {!isAuthenticated ? (
          // Schermata di login pulita senza sidebar
          <div className="min-h-screen flex">
            <main className="flex-1 h-screen">
              <LoginPage />
            </main>
          </div>
        ) : (
          // Clean layout with global sidebar
          <div className="min-h-screen">
            <main className="h-screen">
              {isMobile && (
                <MobileHeader 
                  onMenuClick={() => setMobileSidebarOpen(true)}
                />
              )}
              <Router />
            </main>
          </div>
        )}
        
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
