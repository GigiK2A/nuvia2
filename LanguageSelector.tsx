import React from 'react';

interface LanguageSelectorProps {
  selected: string;
  onChange: (value: string) => void;
}

const languages = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'Vue',
  'Node.js',
  'Python',
  'Django',
  'Flask',
  'PHP',
  'Laravel',
  'TypeScript',
  'Next.js',
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Linguaggio:</label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded px-3 py-2 text-sm"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;