import { toast } from "@/hooks/use-toast";
import { CodeFile } from "@/store/codeStore";

/**
 * Esporta i file di un progetto come archivio ZIP
 * @param files File del progetto da esportare
 * @param projectName Nome del progetto
 */
export async function exportProjectAsZip(files: CodeFile[], projectName: string) {
  try {
    // Prepara i dati per l'esportazione
    const filesData: Record<string, string> = {};
    files.forEach(file => {
      filesData[file.name] = file.content;
    });
    
    const res = await fetch('/api/code/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: filesData,
        name: projectName || 'progetto-nuvia',
      }),
    });
    
    if (!res.ok) {
      throw new Error('Errore durante l\'esportazione del progetto');
    }
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'progetto'}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Progetto esportato",
      description: "Il progetto è stato esportato con successo come file ZIP.",
    });
    
    return true;
  } catch (err) {
    console.error('Errore durante l\'esportazione:', err);
    toast({
      title: "Errore",
      description: "Impossibile esportare il progetto. Riprova più tardi.",
      variant: "destructive",
    });
    
    return false;
  }
}