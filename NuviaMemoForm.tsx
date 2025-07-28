import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Edit3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NuviaMemoFormProps {
  userId: number;
}

export default function NuviaMemoForm({ userId }: NuviaMemoFormProps) {
  const [memo, setMemo] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Fetch existing memo on component mount
  useEffect(() => {
    fetchMemo();
  }, [userId]);

  const fetchMemo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/memory/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMemo(data.memo || '');
      }
    } catch (error) {
      console.error('Error fetching memo:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare il memo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMemo = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/memory/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memo }),
      });

      if (response.ok) {
        setIsEditing(false);
        toast({
          title: "Memo salvato",
          description: "Le tue note personali sono state aggiornate",
        });
      } else {
        throw new Error('Errore nel salvataggio');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il memo",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchMemo(); // Reset to original content
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Note Personali
          </CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Modifica
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Scrivi qui le tue note personali, promemoria, o informazioni importanti che vuoi che Nuvia ricordi..."
              className="min-h-32 resize-none border-gray-200 focus:border-blue-500"
              rows={6}
            />
            <div className="flex gap-2">
              <Button
                onClick={saveMemo}
                disabled={saving}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                Salva
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-32">
            {memo ? (
              <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {memo}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Edit3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna nota salvata</p>
                <p className="text-xs mt-1">Clicca "Modifica" per aggiungere le tue note</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}