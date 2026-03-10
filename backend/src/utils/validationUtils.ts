/**
 * Утилиты для валидации и обработки ошибок
 */

import { Request, Response } from 'express';
import { validationResult, ValidationError as ExpressValidationError } from 'express-validator';
import { ValidationError } from '@/types';

/**
 * Проверяет результаты валидации и возвращает ошибку 400 если есть проблемы
 * @param req - Express request объект
 * @param res - Express response объект
 * @returns true если валидация пройдена, false если есть ошибки
 */
export const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors: ValidationError[] = errors.array().map((error: ExpressValidationError) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));
    
    res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors: validationErrors
    });
    return false;
  }
  return true;
};

/**
 * Проверяет обязательное поле в теле запроса
 * @param body - Тело запроса
 * @param fieldName - Имя поля
 * @param res - Express response объект
 * @returns true если поле присутствует, false если отсутствует
 */
export const validateRequiredField = (body: any, fieldName: string, res: Response): boolean => {
  if (body?.[fieldName] === undefined || body?.[fieldName] === null || (typeof body[fieldName] === 'string' && body[fieldName].trim().length === 0)) {
    res.status(400).json({
      success: false,
      message: `Поле ${fieldName} обязательно`
    });
    return false;
  }
  return true;
};

/**
 * Проверяет значение из списка допустимых
 * @param value - Проверяемое значение
 * @param allowedValues - Массив допустимых значений
 * @param res - Express response объект
 * @param fieldName - Имя поля для сообщения об ошибке
 * @returns true если значение допустимо, false если нет
 */
export const validateEnum = <T extends string>(
  value: string, 
  allowedValues: T[], 
  res: Response, 
  fieldName: string = 'значение'
): boolean => {
  if (!allowedValues.includes(value as T)) {
    res.status(400).json({
      success: false,
      message: `Неверный ${fieldName}`
    });
    return false;
  }
  return true;
};
