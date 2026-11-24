"use client"

// Inline script that runs before first paint on full loads, without React's dev "script tag" warning
// (Next guide: preventing-flash-before-hydration). The client render sees type="text/plain".
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
