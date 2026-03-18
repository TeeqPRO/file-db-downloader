"use client";

import { useEffect, useState } from "react";

import Buttons from "./Buttons";

type Theme = "dark" | "light";

const STORAGE_KEY = "filedb-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initialTheme: Theme = savedTheme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", initialTheme);
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  if (!mounted) return null;
  return (
    <Buttons
      type="primary"
      onClick={toggleTheme}
      className="rounded-md px-3 py-2 text-xs font-semibold"
      ariaLabel="Switch theme"
      text={theme === "dark" ? "Light mode" : "Dark mode"}
    />
  );
}
