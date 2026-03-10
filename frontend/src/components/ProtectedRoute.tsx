import { Navigate } from "react-router-dom";
import {JSX} from "react";

interface Props {
    user: any
    role: string
    children: JSX.Element
}

export default function ProtectedRoute({ user, role, children }: Props) {

    if (!user) {
        return <Navigate to="/login" />
    }

    if (user.role !== role) {
        return <Navigate to="/" />
    }

    return children
}