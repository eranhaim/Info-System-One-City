import { createContext, useContext, useState, type ReactNode } from 'react'

interface UserInfo {
  id: string
  name: string
}

interface UserContextType {
  user: UserInfo | null
  setUser: (user: UserInfo | null) => void
  logout: () => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const saved = sessionStorage.getItem('onecity_user')
    return saved ? JSON.parse(saved) : null
  })

  const handleSetUser = (u: UserInfo | null) => {
    setUser(u)
    if (u) {
      sessionStorage.setItem('onecity_user', JSON.stringify(u))
    } else {
      sessionStorage.removeItem('onecity_user')
    }
  }

  const logout = () => handleSetUser(null)

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
