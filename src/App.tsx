// 7. UPDATE: src/App.tsx or wherever you initialize your app
import React from 'react';
import { ThemeProvider } from "./components/theme-provider"
import ModularInterface from './components/ModularInterface';

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ModularInterface />
    </ThemeProvider>
  );
}

export default App;