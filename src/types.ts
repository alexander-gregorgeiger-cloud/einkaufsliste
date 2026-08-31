export interface ShoppingList {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface ShoppingItem {
  id: string
  listId: string
  name: string
  checked: boolean
  sortOrder: number
  createdAt: Date
}

export interface ItemStat {
  name: string
  count: number
}

export type MealSlot = 'mittag' | 'abend'

export interface Meal {
  id: string
  /** Local calendar day as YYYY-MM-DD, so week queries are plain string ranges. */
  date: string
  slot: MealSlot
  name: string
  ingredients: string[]
}
