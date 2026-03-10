/**
 * Утилиты для стандартизации ответов API
 */

import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@/types';

export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message: string = 'Операция выполнена успешно', 
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  } as ApiResponse<T>);
};

export const sendSuccessWithPagination = <T>(
  res: Response, 
  data: T[], 
  pagination: { current: number; pages: number; total: number; limit: number }, 
  message: string = 'Данные получены'
): void => {
  res.json({
    success: true,
    message,
    data,
    pagination
  } as PaginatedResponse<T>);
};

export const sendCreated = <T>(
  res: Response, 
  data: T, 
  message: string = 'Ресурс успешно создан'
): void => {
  res.status(201).json({
    success: true,
    message,
    data
  } as ApiResponse<T>);
};

export const sendValidationError = (
  res: Response, 
  message: string = 'Ошибка валидации', 
  errors: any[] = []
): void => {
  res.status(400).json({
    success: false,
    message,
    errors
  } as ApiResponse);
};

export const sendNotFound = (res: Response, resourceName: string = 'Ресурс'): void => {
  res.status(404).json({
    success: false,
    message: `${resourceName} не найден`
  } as ApiResponse);
};

export const sendForbidden = (res: Response, message: string = 'Недостаточно прав для выполнения операции'): void => {
  res.status(403).json({
    success: false,
    message
  } as ApiResponse);
};

export const sendUnauthorized = (res: Response, message: string = 'Не авторизован'): void => {
  res.status(401).json({
    success: false,
    message
  } as ApiResponse);
};

export const sendServerError = (res: Response, message: string = 'Внутренняя ошибка сервера'): void => {
  res.status(500).json({
    success: false,
    message
  } as ApiResponse);
};

export const handleError = (
  res: Response, 
  error: Error, 
  contextMessage: string, 
  userMessage: string = 'Внутренняя ошибка сервера'
): void => {
  console.error(contextMessage, error);
  sendServerError(res, userMessage);
};
