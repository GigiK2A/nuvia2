import React from 'react';
import NuviaCalendarEmbed from '@/components/NuviaCalendarEmbed';

export default function CalendarIntegrationPage() {
  // Mock user data - in production this would come from authentication
  const userId = 2;
  const userEmail = 'user@example.com';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Calendario Integrato</h1>
          <p className="text-gray-600">Gestisci i tuoi eventi e crea nuovi appuntamenti direttamente dal tuo calendario Google</p>
        </div>
        
        <NuviaCalendarEmbed 
          userEmail={userEmail} 
          userId={userId} 
        />
      </div>
    </div>
  );
}