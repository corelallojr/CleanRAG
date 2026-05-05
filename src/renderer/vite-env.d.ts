/// <reference types="vite/client" />

declare global {
  interface Window {
    cleanragDesktop: {
      getRuntimeConfig: () => Promise<{ apiBaseUrl: string; hasPython: boolean }>;
      pickFiles: () => Promise<string[]>;
      openExternal: (target: string) => Promise<void>;
    };
  }
}

export {};

