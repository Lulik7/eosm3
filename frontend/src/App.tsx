import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import api from "./api/axios";
import LoginPage from "./pages/loginPage";
import {Dashboard} from "@mui/icons-material";
import SupportPage from "./pages/supportsPage";
import EngineerPage from "./pages/engineersPage";
import AdminPage from "./pages/adminsPage";


// import Dashboard from "./pages/Dashboard"


interface User {
    _id: string
    username: string
    role: "user" | "support" | "engineer" | "admin"
}

function App() {

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        const checkSession = async () => {

            try {

                const res = await api.get("/auth/me")

                setUser(res.data)

            } catch (error) {

                console.log("Session not found or expired")

                setUser(null)

            }

            setLoading(false)

        }

        checkSession()

    }, [])

    if (loading) {
        return <div style={{padding:40}}>Loading...</div>
    }

    return (
        <BrowserRouter>

            <Routes>

                {/* LOGIN */}

                <Route
                    path="/login"
                    element={
                        user
                            ? <Navigate to="/" />
                            : <LoginPage setUser={setUser} />
                    }
                />

                {/* DASHBOARD */}

                <Route
                    path="/"
                    element={
                        user
                            ? <Dashboard user={user} />
                            : <Navigate to="/login" />
                    }
                />

                {/* SUPPORT */}

                <Route
                    path="/support"
                    element={
                        user?.role === "support"
                            ? <SupportPage />
                            : <Navigate to="/" />
                    }
                />

                {/* ENGINEER */}

                <Route
                    path="/engineer"
                    element={
                        user?.role === "engineer"
                            ? <EngineerPage />
                            : <Navigate to="/" />
                    }
                />

                {/* ADMIN */}

                <Route
                    path="/admin"
                    element={
                        user?.role === "admin"
                            ? <AdminPage />
                            : <Navigate to="/" />
                    }
                />

            </Routes>

        </BrowserRouter>
    )
}

export default App