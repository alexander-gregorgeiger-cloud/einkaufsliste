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
