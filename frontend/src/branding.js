import { createContext, useContext } from 'react'
export const BrandingContext = createContext({ name: 'S', logo: null })
export const useBranding = () => useContext(BrandingContext)
export const brandText = (text, name) => typeof text === 'string' ? text.replace(/\bS\b/g, () => name) : text
export const brandCopy = (copy, name) => Object.fromEntries(Object.entries(copy).map(([key, value]) => [key, brandText(value, name)]))
