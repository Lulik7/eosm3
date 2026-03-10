/**
 * Контроллер для работы с запросами Service Desk
 */

import { Response, Request } from 'express';
import RequestModel from '../models/Request';
import { handleValidationErrors, validateRequiredField, validateEnum } from '@/utils';
import { sendSuccess, sendSuccessWithPagination, sendCreated, sendNotFound, sendForbidden, handleError } from '@/utils';
import { buildFilter, addTextSearch, buildSort, buildPaginationOptions, buildPaginationResponse, addPeriodFilter, executePaginatedQuery } from '../utils/queryUtils';
import { canEditResource, canChangeStatus, canAddInternalComments, canDeleteResource } from '@/utils';

const getOwnerId = (owner: unknown): string => {
  if (typeof owner === 'string') return owner;
  const anyOwner = owner as any;
  return (anyOwner?._id ?? anyOwner)?.toString();
};

/**
 * Получение списка запросов с пагинацией и фильтрацией
 * GET /api/requests
 */
export const getRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query;
    
    // Построение фильтров
    const filter = buildFilter(query, ['status', 'priority', 'category', 'assignedTo', 'createdBy']);
    const filterWithSearch = addTextSearch(filter, query['search'] as string, ['title', 'description']);
    const sort = buildSort(query['sortBy'] as string, query['sortOrder'] as 'asc' | 'desc' | undefined);
    const paginationOptions = buildPaginationOptions(query);

    // Выполнение запроса с пагинацией
    const { data: requests, total } = await executePaginatedQuery(
      RequestModel,
      filterWithSearch,
      sort,
      paginationOptions,
      [
        { path: 'createdBy', select: 'username email' },
        { path: 'assignedTo', select: 'username email' },
        { path: 'comments.author', select: 'username' }
      ]
    );

    const pagination = buildPaginationResponse(total, paginationOptions.page, paginationOptions.limit);

    return sendSuccessWithPagination(res, requests, pagination);

  } catch (error) {
    handleError(res, error as Error, 'Ошибка получения запросов:', 'Ошибка при получении запросов');
  }
};

/**
 * Получение одного запроса по ID
 * GET /api/requests/:id
 */
export const getRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await RequestModel.findById(req.params['id'])
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('comments.author', 'username')
      .populate('statusHistory.changedBy', 'username');

    if (!request) {
      return sendNotFound(res, 'Запрос');
    }

    return sendSuccess(res, request);

  } catch (error) {
    handleError(res, error as Error, 'Ошибка получения запроса:', 'Ошибка при получении запроса');
  }
};

/**
 * Создание нового запроса
 * POST /api/requests
 */
export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { title, description, category, priority, tags = [] } = req.body;

    const newRequest = new RequestModel({
      title,
      description,
      category,
      priority,
      tags,
      createdBy: (req as any).user as any // Из middleware аутентификации
    });

    await newRequest.save();

    // Заполняем данные пользователя для ответа
    await newRequest.populate('createdBy', 'username email');

    console.log(`Создан новый запрос #${newRequest._id} пользователем ${(req as any).user.username}`);

    return sendCreated(res, newRequest, 'Запрос успешно создан');

  } catch (error) {
    handleError(res, error as Error, 'Ошибка создания запроса:', 'Ошибка при создании запроса');
  }
};

/**
 * Обновление запроса
 * PUT /api/requests/:id
 */
export const updateRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { title, description, category, priority, tags, assignedTo } = req.body;
    const request = await RequestModel.findById(req.params['id']);
    if (!request) {
      return sendNotFound(res, 'Запрос');
    }

    // Проверка прав на редактирование
    if (!canEditResource((req as any).user, getOwnerId(request.createdBy))) {
      return sendForbidden(res, 'Недостаточно прав для редактирования запроса');
    }

    const updates = {
      title,
      description,
      category,
      priority,
      tags
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        (request as any)[key] = value;
      }
    }

    if (assignedTo !== undefined && ((req as any).user.role === 'admin' || (req as any).user.role === 'support')) {
      request.assignedTo = assignedTo;
    }

    await request.save();
    await request.populate('createdBy assignedTo', 'username email');

    console.log(`Запрос #${request._id} обновлен пользователем ${(req as any).user.username}`);

    return sendSuccess(res, request, 'Запрос успешно обновлен');

  } catch (error) {
    handleError(res, error as Error, 'Ошибка обновления запроса:', 'Ошибка при обновлении запроса');
  }
};

/**
 * Изменение статуса запроса
 * PATCH /api/requests/:id/status
 */
export const changeRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, comment } = req.body;

    if (!validateEnum(status, ['new', 'in_progress', 'pending', 'resolved', 'closed'], res, 'статус')) {
      return;
    }

    const request = await RequestModel.findById(req.params['id']);
    if (!request) {
      return sendNotFound(res, 'Запрос');
    }

    // Проверка прав на изменение статуса
    if (!canChangeStatus((req as any).user, getOwnerId(request.createdBy))) {
      return sendForbidden(res, 'Недостаточно прав для изменения статуса');
    }

    const oldStatus = request.status;
    await request.changeStatus(status, (req as any).user as any, comment);
    await request.populate('statusHistory.changedBy', 'username');

    console.log(`Статус запроса #${request._id} изменен с ${oldStatus} на ${status}`);

    return sendSuccess(res, request, 'Статус успешно изменен');

  } catch (error) {
    handleError(res, error as Error, 'Ошибка изменения статуса:', 'Ошибка при изменении статуса');
  }
};

/**
 * Добавление комментария к запросу
 * POST /api/requests/:id/comments
 */
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, isInternal = false } = req.body;

    if (!validateRequiredField(req.body, 'text', res)) {
      return;
    }

    const request = await RequestModel.findById(req.params['id']);
    if (!request) {
      return sendNotFound(res, 'Запрос');
    }

    // Проверка прав на добавление внутренних комментариев
    if (isInternal && !canAddInternalComments((req as any).user)) {
      return sendForbidden(res, 'Недостаточно прав для добавления внутренних комментариев');
    }

    await request.addComment(text, (req as any).user as any, isInternal);
    await request.populate('comments.author', 'username');

    // Возвращаем только добавленный комментарий
    const newComment = request.comments[request.comments.length - 1];

    console.log(`Добавлен комментарий к запросу #${request._id}`);

    return sendCreated(res, newComment, 'Комментарий добавлен');

  } catch (error) {
    handleError(res, error as Error, 'Ошибка добавления комментария:', 'Ошибка при добавлении комментария');
  }
};

/**
 * Удаление запроса (только для администраторов)
 * DELETE /api/requests/:id
 */
export const deleteRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await RequestModel.findById(req.params['id']);
    if (!request) {
      return sendNotFound(res, 'Запрос');
    }

    // Только администратор может удалять запросы
    if (!canDeleteResource((req as any).user)) {
      return sendForbidden(res, 'Только администратор может удалять запросы');
    }

    await RequestModel.findByIdAndDelete(req.params['id']);

    console.log(`Запрос #${request._id} удален администратором ${(req as any).user.username}`);

    return sendSuccess(res, null, 'Запрос успешно удален');

  } catch (error) {
    handleError(res, error as Error, 'Ошибка удаления запроса:', 'Ошибка при удалении запроса');
  }
};

/**
 * Получение статистики по запросам
 * GET /api/requests/stats
 */
export const getRequestsStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;
    
    // Построение фильтров по периоду
    const filter = addPeriodFilter({}, period as string, 'createdAt');
    const stats = await RequestModel.getStats(filter);

    return sendSuccess(res, stats);

  } catch (error) {
    handleError(res, error as Error, 'Ошибка получения статистики:', 'Ошибка при получении статистики');
  }
};
