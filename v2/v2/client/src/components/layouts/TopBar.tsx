import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 h-16 flex items-center px-4 lg:px-6">
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden mr-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
      >
        <span className="material-icons">menu</span>
      </button>

      <div className="relative max-w-md w-full mx-4 hidden md:block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
          <span className="material-icons text-[20px]">search</span>
        </span>
        <input
          type="text"
          placeholder="Поиск..."
          className="pl-10 pr-4 py-2 w-full border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white text-sm"
        />
      </div>

      <div className="ml-auto flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
        >
          <span
            className={`material-icons ${
              theme === "dark" ? "hidden" : "block"
            }`}
          >
            dark_mode
          </span>
          <span
            className={`material-icons ${
              theme === "light" ? "hidden" : "block"
            }`}
          >
            light_mode
          </span>
        </button>

        <div className="relative">
          <button className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white relative">
            <span className="material-icons">notifications</span>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
        </div>

        <div className="relative">
          <button className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white">
            <span className="material-icons">help_outline</span>
          </button>
        </div>
      </div>
    </header>
  );
}
