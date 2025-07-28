import { useContext } from "react";
import { useThemeContext } from "@/components/ui/theme-provider";

export const useTheme = () => {
  const context = useThemeContext();
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};
