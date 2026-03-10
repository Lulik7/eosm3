/**
 * Контроллер для работы с инцидентами Service Desk
 */

import { Response, Request } from 'express'
import IncidentModel from '../models/Incident'
import { Ticket } from '../models/Ticket'

import {
  handleValidationErrors,
  validateRequiredField,
  validateEnum,
  sendSuccess,
  sendSuccessWithPagination,
  sendCreated,
  sendNotFound,
  sendForbidden,
  handleError,
  isSupportOrAdmin,
  canDeleteResource
} from '@/utils'

import {
  buildFilter,
  addTextSearch,
  buildSort,
  buildPaginationOptions,
  buildPaginationResponse,
  addPeriodFilter,
  executePaginatedQuery
} from '../utils/queryUtils'


/**
 * GET /api/incidents
 */
/**
 * GET /api/incidents
 */
export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {

    const query = req.query
    const user = (req as any).user

    let roleFilter: any = {}

    // user видит только свои инциденты
    if (user.role === "user") {
      roleFilter.createdBy = user._id
    }

    // engineer видит только назначенные ему
    if (user.role === "engineer") {
      roleFilter.assignedTo = user._id
    }

    // support и admin видят всё
    const baseFilter = buildFilter(query, ['status', 'severity', 'type', 'assignedTo', 'createdBy'])

    const filter = {
      ...baseFilter,
      ...roleFilter
    }

    const filterWithSearch = addTextSearch(
        filter,
        query['search'] as string,
        ['title', 'description', 'incidentNumber']
    )

    const sort = buildSort(
        query['sortBy'] as string,
        query['sortOrder'] as 'asc' | 'desc' | undefined
    )

    const paginationOptions = buildPaginationOptions(query)

    const { data: incidents, total } = await executePaginatedQuery(
        IncidentModel,
        filterWithSearch,
        sort,
        paginationOptions,
        [
          { path: 'ticketId', select: 'ticketNumber title createdBy' },
          { path: 'createdBy', select: 'username email' },
          { path: 'assignedTo', select: 'username email' },
          { path: 'responseTeam', select: 'username email' },
          { path: 'updates.author', select: 'username' }
        ]
    )

    const pagination = buildPaginationResponse(
        total,
        paginationOptions.page,
        paginationOptions.limit
    )

    return sendSuccessWithPagination(res, incidents, pagination)

  } catch (error) {
    handleError(res, error as Error, 'Ошибка получения инцидентов:', 'Ошибка при получении инцидентов')
  }
}


/**
 * GET /api/incidents/:id
 */
export const getIncidentById = async (req: Request, res: Response): Promise<void> => {
  try {

    const incident = await IncidentModel.findById(req.params['id'])
        .populate('createdBy', 'username email')
        .populate('assignedTo', 'username email')
        .populate('ticketId', 'ticketNumber title')
        .populate('responseTeam', 'username email')
        .populate('updates.author', 'username')
        .populate('statusHistory.changedBy', 'username')
        .populate('relatedRequests', 'title status')

    if (!incident) {
      return sendNotFound(res, 'Инцидент')
    }

    return sendSuccess(res, incident)

  } catch (error) {
    handleError(res, error as Error, 'Ошибка получения инцидента:', 'Ошибка при получении инцидента')
  }
}


/**
 * POST /api/incidents
 * Создание инцидента
 */
export const createIncident = async (req: Request, res: Response): Promise<void> => {

  try {

    if (!handleValidationErrors(req, res)) return

    const { title, description, severity, type, ticketId } = req.body

    // если передан ticketId → создаем из тикета
    if (ticketId) {

      const ticket = await Ticket.findById(ticketId)

      if (!ticket) {
        return sendNotFound(res, 'Ticket')
      }

      const incident = new IncidentModel({
        title: ticket.title,
        description: ticket.description,
        severity: "medium",
        type: "other",
        createdBy: ticket.createdBy,
        ticketId: ticket._id
      })

      await incident.save()

      //  закрываем тикет после создания инцидента ,Чтобы Support видел что тикет стал Incident
      await Ticket.findByIdAndUpdate(ticketId, {
        status: "closed",
        incidentCreated: true
      })

      await incident.populate('createdBy', 'username email')

      return sendCreated(res, incident, 'Инцидент создан из тикета')

    }

    // обычное создание

    const incident = new IncidentModel({
      title,
      description,
      severity,
      type,
      createdBy: (req as any).user._id
    })

    await incident.save()

    await incident.populate('createdBy', 'username email')

    return sendCreated(res, incident, 'Инцидент успешно создан')

  } catch (error) {
    handleError(res, error as Error, 'Ошибка создания инцидента:', 'Ошибка при создании инцидента')
  }

}


/**
 * PUT /api/incidents/:id
 */
export const updateIncident = async (req: Request, res: Response): Promise<void> => {

  try {

    if (!handleValidationErrors(req, res)) return

    const incident = await IncidentModel.findById(req.params['id'])

    if (!incident) {
      return sendNotFound(res, 'Инцидент')
    }

    if (!isSupportOrAdmin((req as any).user)) {
      return sendForbidden(res, 'Недостаточно прав')
    }

    const updates = req.body

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        (incident as any)[key] = value
      }
    }

    await incident.save()

    await incident.populate('createdBy assignedTo responseTeam', 'username email')

    return sendSuccess(res, incident, 'Инцидент обновлен')

  } catch (error) {
    handleError(res, error as Error, 'Ошибка обновления:', 'Ошибка обновления инцидента')
  }

}


/**
 * PATCH /api/incidents/:id/status
 */
export const changeIncidentStatus = async (req: Request, res: Response): Promise<void> => {

  try {

    const { status, comment } = req.body

    if (!validateEnum(
        status,
        ['new', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'],
        res,
        'статус'
    )) return

    const incident = await IncidentModel.findById(req.params['id'])

    if (!incident) {
      return sendNotFound(res, 'Инцидент')
    }

    if (!isSupportOrAdmin((req as any).user)) {
      return sendForbidden(res, 'Недостаточно прав')
    }

    await incident.changeStatus(status, (req as any).user._id, comment)

    await incident.populate('statusHistory.changedBy', 'username')

    return sendSuccess(res, incident, 'Статус изменен')

  } catch (error) {
    handleError(res, error as Error, 'Ошибка статуса:', 'Ошибка изменения статуса')
  }

}


/**
 * POST /api/incidents/:id/updates
 */
export const addUpdate = async (req: Request, res: Response): Promise<void> => {

  try {

    const { message, isPublic = true } = req.body

    if (!validateRequiredField(req.body, 'message', res)) return

    const incident = await IncidentModel.findById(req.params['id'])

    if (!incident) {
      return sendNotFound(res, 'Инцидент')
    }

    if (!isSupportOrAdmin((req as any).user)) {
      return sendForbidden(res, 'Недостаточно прав')
    }

    await incident.addUpdate(message, (req as any).user._id, isPublic)

    await incident.populate('updates.author', 'username')

    const newUpdate = incident.updates[incident.updates.length - 1]

    return sendCreated(res, newUpdate, 'Обновление добавлено')

  } catch (error) {
    handleError(res, error as Error, 'Ошибка обновления:', 'Ошибка добавления обновления')
  }

}


/**
 * DELETE /api/incidents/:id
 */
export const deleteIncident = async (req: Request, res: Response): Promise<void> => {

  try {

    const incident = await IncidentModel.findById(req.params['id'])

    if (!incident) {
      return sendNotFound(res, 'Инцидент')
    }

    if (!canDeleteResource((req as any).user)) {
      return sendForbidden(res, 'Только администратор может удалять')
    }

    await IncidentModel.findByIdAndDelete(req.params['id'])

    return sendSuccess(res, null, 'Инцидент удален')

  } catch (error) {
    handleError(res, error as Error, 'Ошибка удаления:', 'Ошибка удаления инцидента')
  }

}


/**
 * GET /api/incidents/stats
 */
export const getIncidentsStats = async (req: Request, res: Response): Promise<void> => {

  try {

    const { period } = req.query

    const filter = addPeriodFilter({}, period as string, 'createdAt')

    const stats = await IncidentModel.getStats(filter)

    return sendSuccess(res, stats)

  } catch (error) {
    handleError(res, error as Error, 'Ошибка статистики:', 'Ошибка получения статистики')
  }

}