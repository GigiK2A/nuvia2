import React from 'react';
import { useLocation } from 'wouter';
import NuviaDashboard from '@/components/NuviaDashboard';
import { useAuth } from '@/hooks/useAuth';

export default function NuviaPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Accesso richiesto</p>
        </div>
      </div>
    );
  }

  return (
    <NuviaDashboard 
      userId={user.id} 
      userEmail={user.email}
      onBackToDashboard={handleBackToDashboard}
    />
  );
}