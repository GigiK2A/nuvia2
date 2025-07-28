import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { LogIn, Calendar, MessageSquare, FileText, Code, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/';
      } else {
        toast({
          title: "Errore di accesso",
          description: data.message || "Credenziali non valide",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile connettersi al server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen space-grid flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="space-card">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 space-card nebula-glow rounded-full flex items-center justify-center mx-auto"
            >
              <User className="w-10 h-10 text-primary" />
            </motion.div>
            <CardTitle className="text-3xl font-bold stellar-text">
              Benvenuto in Nuvia AI
            </CardTitle>
            <p className="text-muted-foreground">
              Il tuo assistente personale intelligente
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Features Preview */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-3 hologram-effect rounded-lg"
              >
                <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-foreground">Chat AI</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center p-3 hologram-effect rounded-lg"
              >
                <Calendar className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-xs text-foreground">Calendario</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center p-3 hologram-effect rounded-lg"
              >
                <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-foreground">Documenti</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center p-3 hologram-effect rounded-lg"
              >
                <Code className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-xs text-foreground">Codice</p>
              </motion.div>
            </div>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="username" className="stellar-text">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Inserisci il tuo username"
                  className="cosmic-input"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="stellar-text">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Inserisci la tua password"
                    className="cosmic-input pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full space-button"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Accesso in corso...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Accedi
                  </>
                )}
              </Button>
            </motion.form>

            <p className="text-xs text-gray-500 text-center">
              Contatta l'amministratore per ottenere un account
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}