'use client';

import { useSyncExternalStore } from 'react';

const sidebarStateCache = new Map<string, boolean>();
const sidebarSubscribers = new Map<string, Set<() => void>>();

function readStoredState(storageKey: string, defaultCollapsed: boolean) {
  if (typeof window === 'undefined') {
    return defaultCollapsed;
  }

  const cached = sidebarStateCache.get(storageKey);
  if (cached !== undefined) {
    return cached;
  }

  const stored = window.localStorage.getItem(storageKey);
  const value = stored === null ? defaultCollapsed : stored === '1';
  sidebarStateCache.set(storageKey, value);
  return value;
}

function notifySubscribers(storageKey: string) {
  sidebarSubscribers.get(storageKey)?.forEach((callback) => callback());
}

function writeStoredState(storageKey: string, collapsed: boolean) {
  sidebarStateCache.set(storageKey, collapsed);
  window.localStorage.setItem(storageKey, collapsed ? '1' : '0');
  notifySubscribers(storageKey);
}

function subscribe(storageKey: string, callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let subscribers = sidebarSubscribers.get(storageKey);
  if (!subscribers) {
    subscribers = new Set();
    sidebarSubscribers.set(storageKey, subscribers);
  }

  subscribers.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      sidebarStateCache.delete(storageKey);
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    subscribers?.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

export function useSidebarCollapseState(storageKey: string, defaultCollapsed = false) {
  const collapsed = useSyncExternalStore(
    (callback) => subscribe(storageKey, callback),
    () => readStoredState(storageKey, defaultCollapsed),
    () => defaultCollapsed
  );

  const setCollapsed = (next: boolean | ((current: boolean) => boolean)) => {
    const current = readStoredState(storageKey, defaultCollapsed);
    const resolved = typeof next === 'function' ? next(current) : next;
    writeStoredState(storageKey, resolved);
  };

  return [collapsed, setCollapsed] as const;
}
