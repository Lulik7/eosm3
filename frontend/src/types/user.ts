// 1. Определяем строгие роли, как на твоем бэкенде
export type UserRole = 'admin' | 'support' | 'engineer' | 'user';

// 2. Структура объекта пользователя
export interface User {
    _id: string;
    id?:string
    username: string;
    email: string;
    role: UserRole;
}

// 3. Структура ответа от твоего API (authController.ts)
export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        authenticated: boolean;
    };
    message?: string;
}