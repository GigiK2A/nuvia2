import React from 'react';
import SimpleCalendar from '@/components/SimpleCalendar';
import { useAuth } from '@/hooks/useAuth';

export default function CalendarPage() {
  const { user } = useAuth();
  const userId = user?.id || 1;

  return (
    <div className="min-h-screen bg-white">
      <SimpleCalendar userId={userId} />
    </div>
  );
}