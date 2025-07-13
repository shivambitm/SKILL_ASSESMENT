import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type ThemeType = "light" | "premium" | "anime";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const themes: ThemeType[] = ["light", "premium", "anime"];

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    // Get theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem("theme") as ThemeType;
    return savedTheme && themes.includes(savedTheme) ? savedTheme : "light";
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem("theme", theme);

    // Remove all theme classes first
    const html = document.documentElement;
    html.classList.remove("light", "premium", "anime");

    // Add current theme class
    html.classList.add(theme);

    // Set CSS custom properties for the theme
    applyThemeVariables(theme);
  }, [theme]);

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

const applyThemeVariables = (theme: ThemeType) => {
  const root = document.documentElement;

  switch (theme) {
    case "light":
      root.style.setProperty("--bg-primary", "#ffffff");
      root.style.setProperty("--bg-secondary", "#f8fafc");
      root.style.setProperty("--text-primary", "#1f2937");
      root.style.setProperty("--text-secondary", "#6b7280");
      root.style.setProperty("--border-color", "#e5e7eb");
      root.style.setProperty("--accent-color", "#3b82f6");
      root.style.setProperty("--accent-hover", "#2563eb");
      break;

    case "premium":
      root.style.setProperty("--bg-primary", "#0f0f23");
      root.style.setProperty("--bg-secondary", "#1a1a2e");
      root.style.setProperty("--text-primary", "#ffffff");
      root.style.setProperty("--text-secondary", "#e2e8f0");
      root.style.setProperty("--border-color", "#6366f1");
      root.style.setProperty("--accent-color", "#8b5cf6");
      root.style.setProperty("--accent-hover", "#7c3aed");
      root.style.setProperty("--category-bg", "#2d3748");
      root.style.setProperty("--category-text", "#ffffff");
      break;

    case "anime":
      root.style.setProperty("--bg-primary", "#fef7ed");
      root.style.setProperty("--bg-secondary", "#fff7ed");
      root.style.setProperty("--text-primary", "#1c1917");
      root.style.setProperty("--text-secondary", "#a8a29e");
      root.style.setProperty("--border-color", "#fbbf24");
      root.style.setProperty("--accent-color", "#f59e0b");
      root.style.setProperty("--accent-hover", "#d97706");
      break;
  }
};
