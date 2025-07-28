import React from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Menu, Sun, Moon } from "lucide-react";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  const { setTheme, theme } = useTheme();

  return (
    <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-bold">AI Assistant</h1>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "light" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

export default MobileHeader;