// Simple feature flag utility for the frontend
// Sources (priority high -> low): URL (?ff_<name>=1/0) -> localStorage ('ff_<name>') -> Vite env (VITE_FLAG_<NAME>)

function readFromUrl(name: string): boolean | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(`ff_${name}`);
  if (value === '1') return true;
  if (value === '0') return false;
  return null;
}

function readFromStorage(name: string): boolean | null {
  try {
    const v = localStorage.getItem(`ff_${name}`);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {}
  return null;
}

function readFromEnv(name: string): boolean | null {
  const key = `VITE_FLAG_${name.toUpperCase()}` as keyof ImportMetaEnv;
  const v = (import.meta as any)?.env?.[key];
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
}

export const flags = {
  isEnabled(name: string, fallback = false): boolean {
    const vUrl = readFromUrl(name);
    if (vUrl !== null) return vUrl;
    const vStore = readFromStorage(name);
    if (vStore !== null) return vStore;
    const vEnv = readFromEnv(name);
    if (vEnv !== null) return vEnv;
    return fallback;
  }
};

export default flags;

