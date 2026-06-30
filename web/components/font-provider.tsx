"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type FontContextType = {
  font: string;
  setFont: (font: string) => void;
};

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<string>("Inter"); // Default font

  useEffect(() => {
    // Check local storage on mount
    const savedFont = localStorage.getItem("app-font");
    if (savedFont) {
      setFontState(savedFont);
    }
  }, []);

  const setFont = (newFont: string) => {
    setFontState(newFont);
    localStorage.setItem("app-font", newFont);
  };

  useEffect(() => {
    if (!font) return;
    
    const linkId = "dynamic-google-font";
    let link = document.getElementById(linkId) as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    
    // Load the font from Google Fonts
    const formattedFontName = font.replace(/ /g, "+");
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@300;400;500;600;700&display=swap`;
    
    // Apply font to the body
    document.body.style.fontFamily = `"${font}", sans-serif`;
    
  }, [font]);

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}
