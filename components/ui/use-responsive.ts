"use client"

import { useSyncExternalStore } from "react"

export interface ResponsiveProp<T> {
  sm?: T
  md?: T
  lg?: T
  xl?: T
  "2xl"?: T
}

// Tailwind default breakpoints, widest first.
const BREAKPOINTS = [
  ["2xl", 1536],
  ["xl", 1280],
  ["lg", 1024],
  ["md", 768],
  ["sm", 640],
] as const

function subscribe(cb: () => void) {
  window.addEventListener("resize", cb)
  return () => window.removeEventListener("resize", cb)
}

const getWidth = () => window.innerWidth
const getServerWidth = () => 0

export function useResponsive<T>(value: T | ResponsiveProp<T>): T {
  const w = useSyncExternalStore(subscribe, getWidth, getServerWidth)
  if (typeof value !== "object" || value === null) return value
  const v = value as ResponsiveProp<T>
  for (const [key, min] of BREAKPOINTS) {
    if (w >= min && v[key] !== undefined) return v[key] as T
  }
  // below the smallest matching breakpoint: smallest value provided
  return (v.sm ?? v.md ?? v.lg ?? v.xl ?? v["2xl"]) as T
}
