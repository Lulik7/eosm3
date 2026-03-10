// /**
//  * Основные типы и интерфейсы для Service Desk приложения
//  */
//


import mongoose, { Document } from 'mongoose';
import { Session as ExpressSession } from 'express-session';


// ---------- USER TYPES ----------

export type UserRole = 'user' | 'support' | 'engineer' | 'admin'

export interface IUser extends Document {
  _id: string
  username: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date

  comparePassword(password: string): Promise<boolean>
  toSafeObject(): SafeUser
}

export interface SafeUser {
  _id: string
  username: string
  email: string
  role: UserRole
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

// ---------- INCIDENT TYPES ----------

export type IncidentStatus =
    | 'new'
    | 'investigating'
    | 'identified'
    | 'monitoring'
    | 'resolved'
    | 'closed'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export type IncidentType =
    | 'hardware'
    | 'software'
    | 'network'
    | 'security'
    | 'other'

export interface IIncident extends Document {

  _id: string

  // связь с тикетом
  ticketId?: {
    _id: string
    ticketNumber: string
    title: string
  }

  incidentNumber: string
  title: string
  description: string
  status: IncidentStatus
  severity: IncidentSeverity
  type: IncidentType

  affectedServices: string[]

  affectedUsers: {
    estimated: number
    actual: number
  }

  startedAt: Date
  detectedAt: Date
  resolvedAt?: Date

  createdBy: string | IUser
  assignedTo?: string | IUser
  responseTeam?: string | IUser[]

  rootCause?: string
  resolution?: string
  preventionPlan?: string
  impactCost?: number

  updates: IncidentUpdate[]
  statusHistory: StatusChange<IncidentStatus>[]

  relatedRequests: string[]

  createdAt: Date
  updatedAt: Date

  changeStatus(
      newStatus: IncidentStatus,
      userId: string,
      comment?: string
  ): Promise<void>

  addUpdate(
      message: string,
      userId: string,
      isPublic: boolean
  ): Promise<void>
}

export interface IncidentUpdate {
  _id?: string
  message: string
  author: string | IUser
  isPublic: boolean
  createdAt: Date
}

export interface StatusChange<TStatus extends string = IncidentStatus> {
  _id?: string
  fromStatus: TStatus
  toStatus: TStatus
  changedBy: string | IUser
  comment?: string
  changedAt: Date
}

// ---------- ENGINEER DASHBOARD TYPE ----------

export interface EngineerTask {

  _id: string

  incidentNumber: string

  title: string

  location?: string

  status: IncidentStatus

  createdAt: Date

  ticketId?: {
    _id: string
    ticketNumber: string
    title: string
  }

}

// ---------- REQUEST TYPES ----------

export type RequestStatus =
    | 'new'
    | 'in_progress'
    | 'pending'
    | 'resolved'
    | 'closed'

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent'

export type RequestCategory =
    | 'hardware'
    | 'software'
    | 'network'
    | 'access'
    | 'training'
    | 'other'

export interface IRequest extends Document {

  _id: string
  title: string
  description: string

  status: RequestStatus
  priority: RequestPriority
  category: RequestCategory

  tags: string[]

  createdBy: string | IUser
  assignedTo?: string | IUser

  comments: Comment[]

  statusHistory: StatusChange<RequestStatus>[]

  createdAt: Date
  updatedAt: Date

  changeStatus(
      newStatus: RequestStatus,
      userId: string,
      comment?: string
  ): Promise<void>

  addComment(
      text: string,
      userId: string,
      isInternal: boolean
  ): Promise<void>
}

export interface Comment {
  _id?: string
  text: string
  author: string | IUser
  isInternal: boolean
  createdAt: Date
  updatedAt: Date
}

// ---------- API TYPES ----------

export interface PaginationQuery {
  page?: string
  limit?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface IncidentQuery extends PaginationQuery {
  status?: IncidentStatus
  severity?: IncidentSeverity
  type?: IncidentType
  assignedTo?: string
  createdBy?: string
  search?: string
}

export interface RequestQuery extends PaginationQuery {
  status?: RequestStatus
  priority?: RequestPriority
  category?: RequestCategory
  assignedTo?: string
  createdBy?: string
  search?: string
}

export interface StatsQuery {
  period?: 'day' | 'week' | 'month'
}

// ---------- API RESPONSES ----------

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: ValidationError[]
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    current: number
    pages: number
    total: number
    limit: number
  }
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

// ---------- SESSION ----------

export interface SessionUser {
  id: string
  username: string
  email: string
  role: UserRole
}

export interface SessionData {
  user: SessionUser
}

export interface AuthenticatedRequest {
  session: SessionData & ExpressSession
  user: IUser
  body: any
  params: any
  query: any
}

// ---------- STATS ----------

export interface IncidentStats {
  total: number
  byStatus: Record<IncidentStatus, number>
  bySeverity: Record<IncidentSeverity, number>
  byType: Record<IncidentType, number>
  avgResolutionTime?: number
  resolvedThisPeriod: number
}

export interface RequestStats {
  total: number
  byStatus: Record<RequestStatus, number>
  byPriority: Record<RequestPriority, number>
  byCategory: Record<RequestCategory, number>
  avgResolutionTime?: number
  resolvedThisPeriod: number
}