/**
 * Модель инцидента Service Desk
 */

import mongoose, { Schema, HydratedDocument } from 'mongoose'
import { IIncident, IncidentStatus, IncidentUpdate, StatusChange } from '@/types'

// ---------- METHODS INTERFACE ----------

interface IIncidentMethods {
  changeStatus(newStatus: IncidentStatus, userId: string, comment?: string): Promise<void>
  addUpdate(message: string, userId: string, isPublic: boolean): Promise<void>
}

type IncidentDocument = HydratedDocument<IIncident, IIncidentMethods>

interface IncidentModel extends mongoose.Model<IIncident, {}, IIncidentMethods> {
  getStats(filters?: any): Promise<any>
}

// ---------- UPDATE SCHEMA ----------

const updateSchema = new Schema<IncidentUpdate>(
    {
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Сообщение не должно превышать 1000 символов']
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      isPublic: {
        type: Boolean,
        default: true
      }
    },
    { timestamps: true }
)

// ---------- STATUS HISTORY ----------

const statusChangeSchema = new Schema<StatusChange<IncidentStatus>>({
  fromStatus: {
    type: String,
    enum: ['new', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'],
    required: true
  },
  toStatus: {
    type: String,
    enum: ['new', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'],
    required: true
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Комментарий не должен превышать 500 символов']
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
})

// ---------- MAIN INCIDENT SCHEMA ----------

const incidentSchema = new Schema<IIncident, IncidentModel, IIncidentMethods>(
    {
      incidentNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
      },

      title: {
        type: String,
        required: [true, 'Название инцидента обязательно'],
        trim: true,
        maxlength: [200, 'Название не должно превышать 200 символов']
      },

      description: {
        type: String,
        required: [true, 'Описание инцидента обязательно'],
        trim: true,
        maxlength: [2000, 'Описание не должно превышать 2000 символов']
      },

      status: {
        type: String,
        enum: ['new', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'],
        default: 'new'
      },

      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: [true, 'Уровень серьезности обязателен']
      },

      type: {
        type: String,
        enum: ['hardware', 'software', 'network', 'security', 'other'],
        required: [true, 'Тип инцидента обязателен']
      },

      // связь с тикетом
      ticketId: {
        type: Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true
      },

      affectedServices: [
        {
          type: String,
          trim: true
        }
      ],

      affectedUsers: {
        estimated: {
          type: Number,
          default: 0,
          min: 0
        },
        actual: {
          type: Number,
          default: 0,
          min: 0
        }
      },

      startedAt: {
        type: Date,
        default: Date.now
      },

      detectedAt: {
        type: Date,
        default: Date.now
      },

      resolvedAt: {
        type: Date
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },

      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },

      responseTeam: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        }
      ],

      rootCause: {
        type: String,
        trim: true,
        maxlength: [1000, 'Описание причины не должно превышать 1000 символов']
      },

      resolution: {
        type: String,
        trim: true,
        maxlength: [2000, 'Описание решения не должно превышать 2000 символов']
      },

      preventionPlan: {
        type: String,
        trim: true,
        maxlength: [2000, 'План профилактики не должен превышать 2000 символов']
      },

      impactCost: {
        type: Number,
        min: 0
      },

      updates: [updateSchema],

      statusHistory: [statusChangeSchema],

      relatedRequests: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Request'
        }
      ]
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    }
)

// ---------- INDEXES ----------

incidentSchema.index({ incidentNumber: 1 })
incidentSchema.index({ status: 1 })
incidentSchema.index({ severity: 1 })
incidentSchema.index({ type: 1 })
incidentSchema.index({ createdBy: 1 })
incidentSchema.index({ assignedTo: 1 })
incidentSchema.index({ ticketId: 1 })
incidentSchema.index({ detectedAt: -1 })

// ---------- AUTO INCIDENT NUMBER ----------

incidentSchema.pre('save', async function (this: IncidentDocument, next) {
  if (this.isNew && !this.incidentNumber) {
    const count = await (this.constructor as mongoose.Model<IIncident>).countDocuments()
    this.incidentNumber = `INC-${String(count + 1).padStart(6, '0')}`

  }

  next()

})

// ---------- METHODS ----------

incidentSchema.methods.changeStatus = async function (
    this: IncidentDocument,
    newStatus: IncidentStatus,
    userId: string,
    comment?: string
): Promise<void> {
  const oldStatus = this.status

  this.statusHistory.push({
    fromStatus: oldStatus,
    toStatus: newStatus,
    changedBy: userId,
    ...(comment ? { comment } : {}),
    changedAt: new Date()
  })

  this.status = newStatus

  if ((newStatus === 'resolved' || newStatus === 'closed') && !this.resolvedAt) {
    this.resolvedAt = new Date()
  }

  await this.save()
}

incidentSchema.methods.addUpdate = async function (
    this: IncidentDocument,
    message: string,
    userId: string,
    isPublic: boolean
): Promise<void> {
  this.updates.push({
    message,
    author: userId,
    isPublic,
    createdAt: new Date()
  })

  await this.save()
}

// ---------- VIRTUAL FIELDS ----------

incidentSchema.virtual('resolutionTime').get(function (this: IncidentDocument) {
  if (this.detectedAt && this.resolvedAt) {
    return this.resolvedAt.getTime() - this.detectedAt.getTime()
  }
  return null
})

incidentSchema.virtual('age').get(function (this: IncidentDocument) {
  return Date.now() - this.detectedAt.getTime()
})

// ---------- MODEL ----------

const Incident = mongoose.model<IIncident, IncidentModel>('Incident', incidentSchema)

export default Incident