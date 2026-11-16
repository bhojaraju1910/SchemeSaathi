import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SchemeData } from '../components/SchemeCard';
import api from '../api/axios';
import {
  loadEmergencySchemes,
  readSessionCache,
  withTimeout,
} from '../utils/clientCache';
import {
  MAX_COMPARE_ITEMS,
  readCompareIds,
  toggleCompareId,
  writeCompareIds,
} from '../utils/schemeTools';

interface CompareContextType {
  compareIds: string[];
  compareSchemes: SchemeData[];
  limitNotice: string | null;
  isCompared: (id: string) => boolean;
  toggleCompare: (scheme: SchemeData) => void;
  removeCompare: (id: string) => void;
  clearCompare: () => void;
  registerSchemes: (schemes: SchemeData[]) => void;
  dismissLimitNotice: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

function hydrateInitialFromSession(): Record<string, SchemeData> {
  const initial: Record<string, SchemeData> = {};
  const quick = readSessionCache<SchemeData[]>('ss_cache_quick_catalog');
  if (quick && Array.isArray(quick.data)) {
    for (const s of quick.data) {
      if (s && s._id) initial[s._id] = s;
    }
  }
  return initial;
}

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareIds, setCompareIds] = useState<string[]>(() => readCompareIds());
  const [schemeMap, setSchemeMap] = useState<Record<string, SchemeData>>(() =>
    hydrateInitialFromSession()
  );
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  useEffect(() => {
    writeCompareIds(compareIds);
  }, [compareIds]);

  // Hydrate any persisted compareIds that aren't in schemeMap yet from API (fallback lazy)
  useEffect(() => {
    const missing = compareIds.filter((id) => !schemeMap[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    async function hydrateMissing() {
      const resolved: SchemeData[] = [];
      let needsEmergency = false;

      await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await withTimeout(
              (signal) => api.get(`/schemes/${id}`, { signal }),
              4000
            );
            if (res.data?.scheme) {
              resolved.push({
                ...res.data.scheme,
                rules: res.data.criteria?.rules || res.data.scheme.rules,
              });
            } else {
              needsEmergency = true;
            }
          } catch {
            needsEmergency = true;
          }
        })
      );

      if (needsEmergency && !cancelled) {
        const emergency = await loadEmergencySchemes();
        for (const id of missing) {
          if (!resolved.some((r) => r._id === id)) {
            const found = emergency.find(
              (s) => s._id === id || s.id === id || s.slug === id
            );
            if (found) {
              resolved.push(found as unknown as SchemeData);
            }
          }
        }
      }

      if (!cancelled && resolved.length > 0) {
        setSchemeMap((prev) => {
          const next = { ...prev };
          for (const s of resolved) {
            if (s?._id) next[s._id] = s;
          }
          return next;
        });
      }
    }

    hydrateMissing();
    return () => {
      cancelled = true;
    };
  }, [compareIds, schemeMap]);

  const registerSchemes = useCallback((schemes: SchemeData[]) => {
    if (!Array.isArray(schemes) || schemes.length === 0) return;
    setSchemeMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const s of schemes) {
        if (s && s._id) {
          const existing = next[s._id];
          if (!existing || (!existing.rules && s.rules)) {
            next[s._id] = existing ? { ...existing, ...s } : s;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const isCompared = useCallback(
    (id: string) => compareIds.includes(id),
    [compareIds]
  );

  const toggleCompare = useCallback((scheme: SchemeData) => {
    if (!scheme || !scheme._id) return;
    setSchemeMap((prev) => ({ ...prev, [scheme._id]: scheme }));
    setCompareIds((prev) => {
      const result = toggleCompareId(prev, scheme._id);
      if (result.limitReached) {
        setLimitNotice(`You can compare up to ${MAX_COMPARE_ITEMS} schemes at a time.`);
      } else {
        setLimitNotice(null);
      }
      return result.ids;
    });
  }, []);

  const removeCompare = useCallback((id: string) => {
    setLimitNotice(null);
    setCompareIds((prev) => prev.filter((item) => item !== id));
  }, []);

  const clearCompare = useCallback(() => {
    setLimitNotice(null);
    setCompareIds([]);
  }, []);

  const dismissLimitNotice = useCallback(() => setLimitNotice(null), []);

  const compareSchemes = compareIds
    .map((id) => schemeMap[id])
    .filter((s): s is SchemeData => Boolean(s));

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        compareSchemes,
        limitNotice,
        isCompared,
        toggleCompare,
        removeCompare,
        clearCompare,
        registerSchemes,
        dismissLimitNotice,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = (): CompareContextType => {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error('useCompare must be used within CompareProvider');
  }
  return ctx;
};
