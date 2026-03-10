/**
 * Модель запроса Service Desk
 */

import mongoose, { Schema, HydratedDocument } from 'mongoose';
import { IRequest, RequestStatus, Comment, StatusChange } from '@/types';

// Интерфейс для методов запроса
interface IRequestMethods {
  changeStatus(newStatus: RequestStatus, userId: string, comment?: string): Promise<void>;
  addComment(text: string, userId: string, isInternal: boolean): Promise<void>;
}

type RequestDocument = HydratedDocument<IRequest, IRequestMethods>;

// Статические методы модели
interface RequestModel extends mongoose.Model<IRequest, {}, IRequestMethods> {
  getStats(filters?: any): Promise<any>;
}

// Схема комментария
const commentSchema = new Schema<Comment>({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Комментарий не должен превышать 1000 символов']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isInternal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Схема изменения статуса
const statusChangeSchema = new Schema<StatusChange<RequestStatus>>({
  fromStatus: {
    type: String,
    enum: ['new', 'in_progress', 'pending', 'resolved', 'closed'],
    required: true
  },
  toStatus: {
    type: String,
    enum: ['new', 'in_progress', 'pending', 'resolved', 'closed'],
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
});

// Основная схема запроса
const requestSchema = new Schema<IRequest, RequestModel, IRequestMethods>({
  title: {
    type: String,
    required: [true, 'Название запроса обязательно'],
    trim: true,
    maxlength: [200, 'Название не должно превышать 200 символов']
  },
  description: {
    type: String,
    required: [true, 'Описание запроса обязательно'],
    trim: true,
    maxlength: [2000, 'Описание не должно превышать 2000 символов']
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'pending', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: [true, 'Приоритет обязателен']
  },
  category: {
    type: String,
    enum: ['hardware', 'software', 'network', 'access', 'training', 'other'],
    required: [true, 'Категория обязательна']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Тег не должен превышать 50 символов']
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [commentSchema],
  statusHistory: [statusChangeSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы
requestSchema.index({ status: 1 });
requestSchema.index({ priority: 1 });
requestSchema.index({ category: 1 });
requestSchema.index({ createdBy: 1 });
requestSchema.index({ assignedTo: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ tags: 1 });

// Метод для изменения статуса
requestSchema.methods.changeStatus = async function(this: RequestDocument, newStatus: RequestStatus, userId: string, comment?: string): Promise<void> {
  const oldStatus = this.status;
  
  // Добавляем запись в историю изменений
  this.statusHistory.push({
    fromStatus: oldStatus,
    toStatus: newStatus,
    changedBy: userId,
    ...(comment !== undefined ? { comment } : {}),
    changedAt: new Date()
  });
  
  // Обновляем статус
  this.status = newStatus;
  
  await this.save();
};

// Метод для добавления комментария
requestSchema.methods.addComment = async function(this: RequestDocument, text: string, userId: string, isInternal: boolean): Promise<void> {
  this.comments.push({
    text,
    author: userId,
    isInternal,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await this.save();
};

// Виртуальное поле для возраста запроса
requestSchema.virtual('age').get(function(this: RequestDocument) {
  return Date.now() - this.createdAt.getTime();
});

// Виртуальное поле для количества комментариев
requestSchema.virtual('commentCount').get(function(this: RequestDocument) {
  return this.comments.length;
});

// Статический метод для получения статистики
requestSchema.statics['getStats'] = async function(this: RequestModel, filters?: any) {
  const matchFilters = filters || {};
  
  const stats = await this.aggregate([
    { $match: matchFilters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1
          }
        },
        byCategory: {
          $push: {
            category: '$category',
            count: 1
          }
        },
        avgResolutionTime: {
          $avg: {
            $cond: {
              if: { $and: [{ $ne: ['$createdAt', null] }, { $in: ['$status', ['resolved', 'closed']] }] },
              then: { $subtract: [new Date(), '$createdAt'] },
              else: null
            }
          }
        },
        resolvedThisPeriod: {
          $sum: {
            $cond: [
              { $in: ['$status', ['resolved', 'closed']] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  const result = stats[0] || {
    total: 0,
    byStatus: {},
    byPriority: {},
    byCategory: {},
    avgResolutionTime: 0,
    resolvedThisPeriod: 0
  };
  
  // Преобразуем массивы в объекты
  result.byStatus = result.byStatus.reduce((acc: any, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  
  result.byPriority = result.byPriority.reduce((acc: any, item: any) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1;
    return acc;
  }, {});
  
  result.byCategory = result.byCategory.reduce((acc: any, item: any) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  
  return result;
};

// Middleware для логирования изменений статуса
requestSchema.post('save', function(this: RequestDocument) {
  if (this.isModified('status')) {
    console.log(`Статус запроса #${this._id} изменен на ${this.status}`);
  }
});

const Request = mongoose.model<IRequest, RequestModel>('Request', requestSchema);

export default Request;
