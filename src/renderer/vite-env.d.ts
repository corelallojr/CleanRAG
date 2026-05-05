/// <reference types="vite/client" />

declare global {
  interface Window {
    cleanragDesktop: {
      getRuntimeConfig: () => Promise<{
        apiBaseUrl: string;
        hasPython: boolean;
        hasDocker: boolean;
        backendMode: "docker" | "python" | "unavailable";
      }>;
      pickFiles: () => Promise<string[]>;
      openExternal: (target: string) => Promise<void>;
      runSetupHelper: () => Promise<boolean>;
    };
  }
}

export {};
