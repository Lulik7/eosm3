/**
 * Утилиты для построения запросов, фильтрации и пагинации
 */

import { Document } from 'mongoose';

/**
 * Создает объект фильтра на основе query параметров
 * @param query - Query параметры запроса
 * @param allowedFields - Массив допустимых полей для фильтрации
 * @returns Объект фильтра для MongoDB
 */
export const buildFilter = (query: any, allowedFields: string[]): Record<string, any> => {
  const filter: Record<string, any> = {};
  
  allowedFields.forEach(field => {
    if (query[field]) {
      filter[field] = query[field];
    }
  });
  
  return filter;
};

/**
 * Добавляет текстовый поиск в фильтр
 * @param filter - Существующий фильтр
 * @param searchTerm - Текст для поиска
 * @param searchFields - Поля для поиска
 * @returns Обновленный фильтр
 */
export const addTextSearch = (
  filter: Record<string, any>, 
  searchTerm: string, 
  searchFields: string[] = ['title', 'description']
): Record<string, any> => {
  if (!searchTerm) return filter;
  
  const searchConditions = searchFields.map(field => ({
    [field]: { $regex: searchTerm, $options: 'i' }
  }));
  
  return {
    ...filter,
    $or: searchConditions
  };
};

/**
 * Создает объект сортировки
 * @param sortBy - Поле для сортировки
 * @param sortOrder - Порядок сортировки ('asc' или 'desc')
 * @returns Объект сортировки для MongoDB
 */
export const buildSort = (sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Record<string, 1 | -1> => {
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  return sort;
};

/**
 * Создает опции пагинации
 * @param query - Query параметры
 * @returns Объект с опциями пагинации
 */
export const buildPaginationOptions = (query: any): { page: number; limit: number; skip: number } => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

/**
 * Создает объект пагинации для ответа
 * @param total - Общее количество документов
 * @param page - Текущая страница
 * @param limit - Лимит на странице
 * @returns Объект пагинации
 */
export const buildPaginationResponse = (
  total: number, 
  page: number, 
  limit: number
): { current: number; pages: number; total: number; limit: number } => {
  return {
    current: page,
    pages: Math.ceil(total / limit),
    total,
    limit
  };
};

/**
 * Добавляет фильтр по периоду времени
 * @param filter - Существующий фильтр
 * @param period - Период ('day', 'week', 'month')
 * @param dateField - Поле с датой для фильтрации
 * @returns Обновленный фильтр
 */
export const addPeriodFilter = (
  filter: Record<string, any>, 
  period?: string, 
  dateField: string = 'createdAt'
): Record<string, any> => {
  if (!period) return filter;
  
  const now = new Date();
  let dateFilter: Record<string, Date>;
  
  switch (period) {
    case 'day':
      dateFilter = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
      break;
    case 'week':
      dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      break;
    case 'month':
      dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
      break;
    default:
      return filter;
  }
  
  return {
    ...filter,
    [dateField]: dateFilter
  };
};

/**
 * Выполняет запрос с пагинацией и возвращает результат
 * @param Model - Модель Mongoose
 * @param filter - Фильтр
 * @param sort - Сортировка
 * @param paginationOptions - Опции пагинации
 * @param populate - Поля для populate
 * @returns Результат с данными и пагинацией
 */
export const executePaginatedQuery = async <T extends Document>(
  Model: any,
  filter: Record<string, any>,
  sort: Record<string, 1 | -1>,
  paginationOptions: { limit: number; skip: number },
  populate: string | any[] = ''
): Promise<{ data: T[]; total: number }> => {
  const { limit, skip } = paginationOptions;
  
  const [data, total] = await Promise.all([
    Model.find(filter)
      .populate(populate)
      .sort(sort)
      .limit(limit)
      .skip(skip),
    Model.countDocuments(filter)
  ]);
  
  return {
    data,
    total
  };
};
