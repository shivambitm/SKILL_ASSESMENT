import React from "react";
import { Palette, Sun, Moon, Star, Sparkles } from "lucide-react";
import { useTheme, ThemeType } from "../../contexts/ThemeContext";

const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();

  const getThemeIcon = (themeType: ThemeType) => {
    switch (themeType) {
      case "light":
        return <Sun className="w-4 h-4" />;
      case "dark":
        return <Moon className="w-4 h-4" />;
      case "premium":
        return <Star className="w-4 h-4" />;
      case "anime":
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
    }
  };

  const getThemeColor = (themeType: ThemeType) => {
    switch (themeType) {
      case "light":
        return "text-yellow-500";
      case "premium":
        return "text-purple-500";
      case "anime":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const getThemeLabel = (themeType: ThemeType) => {
    switch (themeType) {
      case "light":
        return "Light";
      case "premium":
        return "Premium";
      case "anime":
        return "Anime";
      default:
        return "Theme";
    }
  };

  const themes: ThemeType[] = ["light", "premium", "anime"];

  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${getThemeColor(
          theme
        )} hover:bg-gray-100 dark:hover:bg-gray-800`}
        title={`Current theme: ${getThemeLabel(theme)}. Click to cycle themes.`}
      >
        {getThemeIcon(theme)}
        <span className="hidden sm:inline text-sm font-medium">
          {getThemeLabel(theme)}
        </span>
      </button>

      {/* Dropdown menu for direct theme selection */}
      <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {themes.map((themeOption) => (
          <button
            key={themeOption}
            onClick={() => setTheme(themeOption)}
            className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${
              theme === themeOption
                ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className={`mr-2 ${getThemeColor(themeOption)}`}>
              {getThemeIcon(themeOption)}
            </span>
            {getThemeLabel(themeOption)}
            {theme === themeOption && (
              <span className="ml-auto text-blue-600 dark:text-blue-300">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
