/**
 * Middleware для проверки аутентификации
 * 
 * Работает с JWT (access token) в httpOnly cookie
 */

import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { verifyAccessToken } from '@/utils/jwtUtils';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}
// --------------------1-----------
// const requireAdminTyped = (req: Request, res: Response, next: NextFunction): void => {
//   const user = (req as AuthenticatedRequest).user;
//   if (!user?.role || user.role !== 'admin') {
//     res.status(403).json({
//       success: false,
//       message: 'Требуются права администратора',
//       code: 'ADMIN_REQUIRED'
//     });
//     return;
//   }
//   next();
// };

const requireAdminTyped = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthenticatedRequest).user;
  if (user?.role === 'admin') {
    return next(); // Если админ — проходим дальше
  }
  res.status(403).json({
    success: false,
    message: 'Требуются права администратора',
    code: 'ADMIN_REQUIRED'
  });
};
// ----------------1-------------------


// -----------------------2-----------------------
// const requireSupportTyped = (req: Request, res: Response, next: NextFunction): void => {
//   const user = (req as AuthenticatedRequest).user;
//   if (!user?.role || !['admin', 'support'].includes(user.role)) {
//     res.status(403).json({
//       success: false,
//       message: 'Требуются права поддержки или администратора',
//       code: 'SUPPORT_REQUIRED'
//     });
//     return;
//   }
//   next();
// };

// 2. Поддержка ИЛИ Админ
const requireSupportTyped = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthenticatedRequest).user;
  // ПУСКАЕМ, если роль admin или support
  if (user?.role === 'admin' || user?.role === 'support') {
    return next();
  }
  res.status(403).json({ success: false, message: 'Доступ запрещен' });
};

// --------------------------2------------------------------------


// 3. Инженер ИЛИ Админ (ДОБАВЬ ЭТО, если его нет)
const requireEngineerTyped = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthenticatedRequest).user;
  // ПУСКАЕМ, если роль admin или engineer
  if (user?.role === 'admin' || user?.role === 'engineer') {
    return next();
  }
  res.status(403).json({ success: false, message: 'Доступ запрещен' });
};




/**
 * Проверка авторизации пользователя
 * Использует access token из httpOnly cookie
 */
const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const accessToken = (req as any).cookies?.accessToken as string | undefined;
    if (!accessToken) {
      console.log('[AUTH] 401 missing accessToken cookie');
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация',
        code: 'AUTH_REQUIRED'
      });
    }

    const payload = verifyAccessToken(accessToken);
    const userId = payload.sub;

    // Дополнительная проверка - существует ли пользователь в БД
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      console.log('[AUTH] 401 user not found or inactive', { userId });
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден или деактивирован',
        code: 'USER_NOT_FOUND'
      });
    }

    // Добавляем пользователя в запрос для дальнейшего использования
    (req as AuthenticatedRequest).user = user;
    next();

  } catch (error) {
    console.log('[AUTH] 401 invalid access token');
    res.status(401).json({
      success: false,
      message: 'Требуется авторизация',
      code: 'AUTH_REQUIRED'
    });
  }
};

/**
 * Опциональная аутентификация - не блокирует запрос если нет access token
 */
const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const accessToken = (req as any).cookies?.accessToken as string | undefined;
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      const user = await User.findById(payload.sub);
      if (user && user.isActive) {
        (req as AuthenticatedRequest).user = user;
      }
    }
    next();
  } catch (error) {
    console.error('Ошибка в optionalAuth middleware:', error);
    next(); // Продолжаем даже если ошибка
  }
};

export {
  authenticate,
  requireAdminTyped as requireAdmin,
  requireSupportTyped as requireSupport,
  requireEngineerTyped as requireEngineer,
  optionalAuth
};
