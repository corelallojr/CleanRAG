import { useEffect, useState } from "react";
import { configureApi } from "../lib/api";
import type { RuntimeConfig } from "../../shared";

export function useRuntimeConfig(): RuntimeConfig | null {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    void window.cleanragDesktop.getRuntimeConfig().then((runtime) => {
      if (!cancelled) {
        configureApi(runtime.apiBaseUrl);
        setConfig(runtime);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
