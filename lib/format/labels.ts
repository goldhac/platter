// Human labels for the machine tag values stored on items.

const DIETARY: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  contains_pork: "Contains pork",
  seafood: "Seafood",
  gluten_free: "Gluten-free",
};

export function prettyDietary(tag: string): string {
  return DIETARY[tag] ?? tag.replace(/_/g, " ");
}

export function prettyAllergen(a: string): string {
  return a.charAt(0).toUpperCase() + a.slice(1);
}

const SPICE_LABEL = ["Not spicy", "Mild", "Medium", "Hot"] as const;
export function spiceLabel(level: number): string {
  return SPICE_LABEL[Math.max(0, Math.min(3, level))];
}
