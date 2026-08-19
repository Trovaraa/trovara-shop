export const FARM_ORIGIN = (import.meta.env.VITE_PUBLIC_MARKETING_URL || 'https://trovara.farm').replace(
  /\/+$/,
  '',
)

export const FARM_PRODUCTS_URL = `${FARM_ORIGIN}/products`

export function productImage(name: string): string | null {
  const lower = name.toLowerCase()
  if (lower.includes('plantain')) return `${FARM_ORIGIN}/images/products/trovara-fresh-plantain.jpg`
  if (lower.includes('coconut')) return `${FARM_ORIGIN}/images/products/trovara-fresh-coconut.jpg`
  if (lower.includes('egg')) return `${FARM_ORIGIN}/images/products/trovara-fresh-eggs.jpg`
  if (lower.includes('palm')) return `${FARM_ORIGIN}/images/products/trovara-fresh-palm-oil.jpg`
  if (lower.includes('chicken') || lower.includes('poultry')) {
    return `${FARM_ORIGIN}/images/products/pasture-raised-chicken.jpg`
  }
  return null
}
