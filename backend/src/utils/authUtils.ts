/**
 * Утилиты для проверки прав доступа и аутентификации
 */

import { UserRole, IUser } from '@/types';
import { verifyAccessToken } from './jwtUtils';

/**
 * Проверяет, имеет ли пользователь одну из указанных ролей
 * @param user - Объект пользователя
 * @param allowedRoles - Допустимые роли
 * @returns true если пользователь имеет доступ
 */
export const hasRole = (user: IUser | null | undefined, allowedRoles: UserRole | UserRole[]): boolean => {
  if (!user || !user.role) return false;
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.role);
};

/**
 * Проверяет, является ли пользователь администратором
 * @param user - Объект пользователя
 * @returns true если пользователь администратор
 */
export const isAdmin = (user: IUser | null | undefined): boolean => {
  return hasRole(user, 'admin');
};

/**
 * Проверяет, является ли пользователь сотрудником поддержки или администратором
 * @param user - Объект пользователя
 * @returns true если пользователь support или admin
 */
export const isSupportOrAdmin = (user: IUser | null | undefined): boolean => {
  return hasRole(user, ['support', 'admin']);
};

/**
 * Проверяет, может ли пользователь редактировать ресурс
 * @param user - Объект пользователя
 * @param resourceOwnerId - ID владельца ресурса
 * @returns true если пользователь может редактировать
 */
export const canEditResource = (user: IUser | null | undefined, resourceOwnerId: string): boolean => {
  if (!user) return false;
  
  // Администратор может редактировать всё
  if (user.role === 'admin') return true;
  
  // Support может редактировать всё (в зависимости от бизнес-логики)
  if (user.role === 'support') return true;
  
  // Пользователь может редактировать только свои ресурсы
  return user._id.toString() === resourceOwnerId.toString();
};

/**
 * Проверяет, может ли пользователь изменять статус ресурса
 * @param user - Объект пользователя
 * @param resourceOwnerId - ID владельца ресурса
 * @returns true если пользователь может изменять статус
 */
export const canChangeStatus = (user: IUser | null | undefined, resourceOwnerId: string): boolean => {
  if (!user) return false;
  
  // Администратор и support могут изменять любой статус
  if (['admin', 'support'].includes(user.role)) return true;
  
  // Пользователь может изменять статус только своих ресурсов
  return user._id.toString() === resourceOwnerId.toString();
};

/**
 * Проверяет, может ли пользователь добавлять внутренние комментарии
 * @param user - Объект пользователя
 * @returns true если пользователь может добавлять внутренние комментарии
 */
export const canAddInternalComments = (user: IUser | null | undefined): boolean => {
  return isSupportOrAdmin(user);
};

/**
 * Проверяет, может ли пользователь удалять ресурс
 * @param user - Объект пользователя
 * @returns true если пользователь может удалять
 */
export const canDeleteResource = (user: IUser | null | undefined): boolean => {
  return isAdmin(user);
};

/**
 * Middleware для проверки роли пользователя
 * @param allowedRoles - Допустимые роли
 * @returns Express middleware
 */
export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  return (req: any, res: any, next: any) => {
    if (!hasRole(req.user, allowedRoles)) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для выполнения операции'
      });
    }
    next();
  };
};

/**
 * Middleware для проверки администраторских прав
 * @returns Express middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware для проверки прав support или admin
 * @returns Express middleware
 */
export const requireSupportOrAdmin = requireRole(['support', 'admin']);

/**
 * Проверяет, авторизован ли пользователь
 * @param req - Express request объект
 * @returns true если пользователь авторизован
 */
export const isAuthenticated = (req: any): boolean => {
  return Boolean(req.cookies?.accessToken);
};

/**
 * Получает ID текущего пользователя из сессии
 * @param req - Express request объект
 * @returns ID пользователя или null
 */
export const getCurrentUserId = (req: any): string | null => {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) return null;
    const payload = verifyAccessToken(token);
    return payload.sub;
  } catch {
    return null;
  }
};
