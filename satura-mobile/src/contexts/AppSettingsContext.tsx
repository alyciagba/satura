import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { getSettings, saveSettings } from "@/services/storage";

type AppSettingsContextValue = {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const [highContrast, setHighContrastState] = useState(true);

  useEffect(() => {
    getSettings().then((settings) => {
      setHighContrastState(settings.highContrast);
    });
  }, []);

  function setHighContrast(enabled: boolean) {
    setHighContrastState(enabled);
    void saveSettings({ highContrast: enabled });
  }

  return (
    <AppSettingsContext.Provider value={{ highContrast, setHighContrast }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }
  return context;
}
