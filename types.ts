export interface Scene {
  id: string;
  scriptText: string;
  visualPrompt: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  isGeneratingAudio?: boolean;
  error?: string;
}

export enum AspectRatio {
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16",
}

export type VoiceName = "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";

export interface Subscriber {
  email: string;
  status: "active" | "expired";
  plan: string;
  expirationDate: string; // ISO string date
  dateAdded: string;
}

// Extensão global para garantir que o TypeScript reconheça as propriedades injetadas
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

export {}; // garante que este arquivo seja tratado como módulo pelo TypeScript
