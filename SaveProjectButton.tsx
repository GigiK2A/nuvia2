import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileArchive } from "lucide-react";
import { saveProject } from "@/lib/utils/projectService";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useCodeStore, CodeFile } from "@/store/codeStore";

interface SaveProjectButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Componente per salvare un progetto nel database
 */
export default function SaveProjectButton({ variant = "default", size = "default", className }: SaveProjectButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { files } = useCodeStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const handleSaveProject = async () => {
    if (files.length === 0) {
      toast({
        title: "Nessun file disponibile",
        description: "Non ci sono file da salvare.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Richiedi il nome del progetto all'utente
      const projectName = prompt("Inserisci un nome per il progetto:");
      if (!projectName) {
        setIsSaving(false);
        return; // L'utente ha annullato l'operazione
      }
      
      // Prepara i files come oggetto per l'API (nome: contenuto)
      const filesObject: Record<string, string> = {};
      files.forEach(file => {
        filesObject[file.name] = file.content;
      });
      
      // Salva il progetto tramite l'API
      const response = await saveProject(projectName, filesObject);
      
      toast({
        title: "Progetto salvato",
        description: "Il progetto è stato salvato con successo. Puoi visualizzarlo nella dashboard.",
      });
      
      // Chiedi all'utente se vuole visualizzare i progetti
      if (confirm("Vuoi visualizzare i tuoi progetti salvati?")) {
        setLocation("/projects");
      }
    } catch (error) {
      console.error("Errore nel salvataggio del progetto:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore durante il salvataggio del progetto.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleSaveProject}
      disabled={isSaving}
    >
      <FileArchive className="mr-2 h-4 w-4" />
      {isSaving ? "Salvataggio..." : "Salva Progetto"}
    </Button>
  );
}