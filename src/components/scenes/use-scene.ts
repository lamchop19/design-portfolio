'use client'

import { useSyncExternalStore } from 'react'

import { DEFAULT_SCENE_ID, SCENE_KEY } from '@/lib/scene-choice'

const read = () => document.documentElement.dataset.scene ?? DEFAULT_SCENE_ID

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-scene'] })
  return () => observer.disconnect()
}

/** The scene behind the site, by id ("flower-field-day"). The static HTML can't know a visitor's pick, so it renders the default. */
export const useScene = () => useSyncExternalStore(subscribe, read, () => DEFAULT_SCENE_ID)

/** Puts a scene behind the site and remembers it for the next visit. */
export function setScene(id: string) {
  document.documentElement.dataset.scene = id
  try {
    localStorage.setItem(SCENE_KEY, id)
  } catch {}
}
