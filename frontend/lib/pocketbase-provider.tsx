import React, { createContext, useContext } from 'react'
import PocketBase from 'pocketbase'

export const PocketBaseContext = createContext(null)

export function PocketBaseProvider({ children, value }) {
  return (
    <PocketBaseContext.Provider value={value}>
      {children}
    </PocketBaseContext.Provider>
  )
}

export function usePocketBase() {
  const context = useContext(PocketBaseContext)
  if (!context) {
    throw new Error('usePocketBase must be used within PocketBaseProvider')
  }
  return context
}