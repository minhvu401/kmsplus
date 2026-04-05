/**
 * Lazy-loaded components that aren't always needed on page load
 * Import these instead of direct components to reduce initial JS bundle
 */

import dynamic from "next/dynamic"

// Lazy load Chat component (only needed on specific pages)
export const ChatBoxLazy = dynamic(() => import("./ChatBox"), {
  ssr: false,
})

// Lazy load AI Suggestion Panel (non-critical feature on article pages)
export const AISuggestionPanelLazy = dynamic(
  () => import("./AISuggestionPanel"),
  {
    ssr: false,
  }
)

// Lazy load AI Prompts Settings (only needed in settings page)
export const AIPromptsSettingsLazy = dynamic(
  () => import("./AIPromptsSettings"),
  {
    ssr: false,
  }
)

// Lazy load Floating Chat Bubble (non-critical UX element)
export const FloatingChatBubbleLazy = dynamic(
  () => import("./FloatingChatBubble"),
  {
    ssr: false,
  }
)
