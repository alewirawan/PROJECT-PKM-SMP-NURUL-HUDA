"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  defaultSettings,
  getSchoolSettings,
  listenCmsUpdates,
  type SchoolSettings,
} from "../lib/local-cms";

const SchoolSettingsContext = createContext<SchoolSettings>(defaultSettings);

export function SchoolSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState(defaultSettings);
  useEffect(() => {
    const load = () => setSettings(getSchoolSettings());
    load();
    return listenCmsUpdates(load);
  }, []);
  return (
    <SchoolSettingsContext.Provider value={settings}>
      {children}
    </SchoolSettingsContext.Provider>
  );
}

export function useSchoolSettings() {
  return useContext(SchoolSettingsContext);
}
