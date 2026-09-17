import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DesignSettings, SiteSettings, WebsiteContent } from '../types';
import { DEFAULT_DESIGN, DEFAULT_SITE_SETTINGS, DEFAULT_CONTENT } from '../data/defaults';

interface StudioContextType {
  design: DesignSettings;
  siteSettings: SiteSettings;
  content: WebsiteContent;
  updateDesign: (newDesign: Partial<DesignSettings>) => Promise<void>;
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  updateContent: (newContent: Partial<WebsiteContent>) => Promise<void>;
  resetDesignDefaults: () => Promise<void>;
  loading: boolean;
}

const StudioContext = createContext<StudioContextType>({
  design: DEFAULT_DESIGN,
  siteSettings: DEFAULT_SITE_SETTINGS,
  content: DEFAULT_CONTENT,
  updateDesign: async () => {},
  updateSiteSettings: async () => {},
  updateContent: async () => {},
  resetDesignDefaults: async () => {},
  loading: true,
});

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [design, setDesign] = useState<DesignSettings>(DEFAULT_DESIGN);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState<boolean>(true);

  // Apply dynamic theme properties and font choices to root CSS
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', design.primaryColor || '#202522');
    root.style.setProperty('--color-secondary', design.secondaryColor || '#E8E3DB');
    root.style.setProperty('--color-accent', design.accentColor || '#6B4F3A');
    root.style.setProperty('--color-background', design.backgroundColor || '#F4F1EC');
    root.style.setProperty('--color-surface', design.surfaceColor || '#E8E3DB');
    root.style.setProperty('--color-heading', design.headingColor || '#1C1C1A');
    root.style.setProperty('--color-body', design.bodyTextColor || '#66645F');
    root.style.setProperty('--color-btn', design.buttonColor || '#1C1C1A');
    root.style.setProperty('--color-btn-hover', design.buttonHoverColor || '#6B4F3A');
    root.style.setProperty('--color-border', design.borderColor || '#D8D2C8');
    root.style.setProperty('--radius-app', design.borderRadius || '6px');
    root.style.setProperty('--font-heading', `'${design.headingFont || 'Cormorant Garamond'}', Georgia, serif`);
    root.style.setProperty('--font-body', `'${design.bodyFont || 'Manrope'}', sans-serif`);

    // Standardized original palette requested
    root.style.setProperty('--color-bg', design.backgroundColor || '#F4F1EC');
    root.style.setProperty('--color-text', design.headingColor || '#1C1C1A');
    root.style.setProperty('--color-muted', design.bodyTextColor || '#66645F');
    root.style.setProperty('--color-accent-soft', '#A47C5B');
    root.style.setProperty('--color-dark', '#202522');
    root.style.setProperty('--color-white', '#FFFFFF');
    root.style.setProperty('--font-display', `'${design.headingFont || 'Cormorant Garamond'}', Georgia, serif`);

    document.body.style.backgroundColor = design.backgroundColor || '#F4F1EC';
    document.body.style.color = design.bodyTextColor || '#66645F';
    document.body.style.fontFamily = `'${design.bodyFont || 'Manrope'}', sans-serif`;
  }, [design]);

  useEffect(() => {
    // Listen to designSettings
    const unsubDesign = onSnapshot(doc(db, 'designSettings', 'theme'), (docSnap) => {
      if (docSnap.exists()) {
        setDesign({ ...DEFAULT_DESIGN, ...docSnap.data() } as DesignSettings);
      }
    }, (err) => console.log('Design listener:', err.message));

    // Listen to siteSettings
    const unsubSite = onSnapshot(doc(db, 'siteSettings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...docSnap.data() } as SiteSettings);
      }
    }, (err) => console.log('Site settings listener:', err.message));

    // Listen to websiteContent
    const unsubContent = onSnapshot(doc(db, 'websiteContent', 'home'), (docSnap) => {
      if (docSnap.exists()) {
        setContent({ ...DEFAULT_CONTENT, ...docSnap.data() } as WebsiteContent);
      }
      setLoading(false);
    }, (err) => {
      console.log('Website content listener:', err.message);
      setLoading(false);
    });

    return () => {
      unsubDesign();
      unsubSite();
      unsubContent();
    };
  }, []);

  const updateDesign = async (newDesign: Partial<DesignSettings>) => {
    const updated = { ...design, ...newDesign, updatedAt: new Date().toISOString() };
    setDesign(updated);
    await setDoc(doc(db, 'designSettings', 'theme'), updated, { merge: true });
  };

  const updateSiteSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = { ...siteSettings, ...newSettings, updatedAt: new Date().toISOString() };
    setSiteSettings(updated);
    await setDoc(doc(db, 'siteSettings', 'general'), updated, { merge: true });
  };

  const updateContent = async (newContent: Partial<WebsiteContent>) => {
    const updated = { ...content, ...newContent };
    setContent(updated);
    await setDoc(doc(db, 'websiteContent', 'home'), updated, { merge: true });
  };

  const resetDesignDefaults = async () => {
    setDesign(DEFAULT_DESIGN);
    await setDoc(doc(db, 'designSettings', 'theme'), DEFAULT_DESIGN, { merge: true });
  };

  return (
    <StudioContext.Provider value={{
      design,
      siteSettings,
      content,
      updateDesign,
      updateSiteSettings,
      updateContent,
      resetDesignDefaults,
      loading
    }}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => useContext(StudioContext);
