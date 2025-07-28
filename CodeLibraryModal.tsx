import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface CodeLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (language: string, prompt: string) => void;
}

const examples = [
  {
    language: 'HTML',
    prompt: `Crea una pagina HTML con uno sfondo chiaro, un titolo al centro e un bottone "Contattaci". Quando l'utente clicca sul bottone, mostra un alert con scritto "Grazie per averci contattato!".`,
  },
  {
    language: 'React',
    prompt: `Crea un componente React con Tailwind CSS chiamato PremiumCard. Deve mostrare un titolo, una descrizione e un bottone con effetto hover.`,
  },
  {
    language: 'Python',
    prompt: `Scrivi una funzione Python che calcoli la media di una lista di numeri e ignori i valori non numerici.`,
  },
  {
    language: 'Node.js',
    prompt: `Crea un server Express con una route /api/users che restituisce 3 utenti mock con id, nome ed email.`,
  },
];

const CodeLibraryModal: React.FC<CodeLibraryModalProps> = ({ open, onClose, onSelect }) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <button 
                  onClick={onClose} 
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
                <Dialog.Title 
                  as="h3" 
                  className="text-lg font-bold mb-4 dark:text-white"
                >
                  Scegli un codice da generare
                </Dialog.Title>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {examples.map((ex, i) => (
                    <div
                      key={i}
                      onClick={() => onSelect(ex.language, ex.prompt)}
                      className="cursor-pointer border dark:border-gray-700 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{ex.language}</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{ex.prompt}</p>
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CodeLibraryModal;