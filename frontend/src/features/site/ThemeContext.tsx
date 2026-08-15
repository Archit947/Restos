import React, { createContext, useContext, useEffect } from 'react';
import { getTheme, type SiteTheme } from './themes';

interface ThemeContextValue {
  theme: SiteTheme;
  templateId: string;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getTheme('bloom'),
  templateId: 'bloom',
});

export function useTheme() { return useContext(ThemeContext); }

interface ThemeProviderProps {
  templateId: string;
  children: React.ReactNode;
}

export function ThemeProvider({ templateId, children }: ThemeProviderProps) {
  const theme = getTheme(templateId);

  // Inject Google Fonts
  useEffect(() => {
    const id = `site-font-${theme.id}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = theme.fontsUrl;
      document.head.appendChild(link);
    }
  }, [theme]);

  const cssVars = theme.vars as React.CSSProperties;

  return (
    <ThemeContext.Provider value={{ theme, templateId }}>
      <div
        style={{ ...cssVars, fontFamily: 'var(--s-body-font)', backgroundColor: 'var(--s-bg)', color: 'var(--s-text)', minHeight: '100vh' }}
        className="site-root"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
