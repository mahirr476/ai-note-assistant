// src/App.tsx
import { ThemeProvider } from "./components/theme-provider"
import ModularInterface from './components/ModularInterface'  // 👈 Changed this line

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
  )
}

export default App