import React, { createContext, useContext, useState } from 'react';

export const themes = {
  light: {
    background: '#fff',
    text: '#222',
    primary: '#2E7D32',
    card: '#F8F9FA',
  },
  dark: {
    background: '#181A20',
    text: '#fff',
    primary: '#2E7D32',
    card: '#23262F',
  },
};

const ThemeContext = createContext({
  theme: themes.light,
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark((d) => !d);
  const theme = isDark ? themes.dark : themes.light;
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};