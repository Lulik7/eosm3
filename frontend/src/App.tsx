import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import api from './api/axios'
import LoginPage from './pages/loginPage'
import SupportPage from './pages/supportsPage'
import EngineerPage from './pages/engineersPage'
import AdminPage from './pages/adminsPage'
import UserPage from "./pages/usersPage";

interface User {
    _id: string
    username: string
    role: 'user' | 'support' | 'engineer' | 'admin'
}

const RoleRedirect = ({ user }: { user: User }) => {
    switch (user.role) {
        case 'user':      return <Navigate to="/user" />
        case 'support':   return <Navigate to="/support" />
        case 'engineer':  return <Navigate to="/engineer" />
        case 'admin':     return <Navigate to="/admin" />
        default:          return <Navigate to="/login" />
    }
}

function App() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await api.get('/auth/me')
                const userData = res.data?.data?.user || res.data?.user || res.data
                setUser(userData)
            } catch (error) {
                console.log('Session not found or expired')
                setUser(null)
            }
            setLoading(false)
        }
        checkSession()
    }, [])

    const onLoginSuccess = async () => {
        try {
            const res = await api.get('/auth/me')
            const userData = res.data?.data?.user || res.data?.user || res.data
            setUser(userData)
        } catch (error) {
            console.error('Failed to fetch user after login:', error)
        }
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setUser(null)
        }
    }

    if (loading) return <div style={{ padding: 40 }}>Loading...</div>

    // Проверка: залогинен ли пользователь (любая роль)
    const isAuth = Boolean(user)
    // Проверка: admin может заходить на все страницы
    const isAdmin = user?.role === 'admin'

    return (
        <BrowserRouter>
            <Routes>

                <Route path="/login" element={
                    user ? <RoleRedirect user={user} /> : <LoginPage onLoginSuccess={onLoginSuccess} />
                } />

                <Route path="/" element={
                    user ? <RoleRedirect user={user} /> : <Navigate to="/login" />
                } />

                <Route path="/user" element={
                    user?.role === 'user' || isAdmin
                        ? <UserPage logout={logout} />
                        : <Navigate to="/login" />
                } />

                <Route path="/support" element={
                    user?.role === 'support' || isAdmin
                        ? <SupportPage logout={logout} />
                        : <Navigate to="/login" />
                } />

                <Route path="/engineer" element={
                    user?.role === 'engineer' || isAdmin
                        ? <EngineerPage logout={logout} />
                        : <Navigate to="/login" />
                } />

                <Route path="/admin" element={
                    user?.role === 'admin'
                        ? <AdminPage logout={logout} />
                        : <Navigate to="/login" />
                } />

                <Route path="*" element={<Navigate to="/login" />} />

            </Routes>
        </BrowserRouter>
    )
}

export default App
