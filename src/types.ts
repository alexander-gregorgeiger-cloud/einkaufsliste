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
  createdAt: Date
}

export interface ItemStat {
  name: string
  count: number
}
