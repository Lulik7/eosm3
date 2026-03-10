/**
 * Модель пользователя Service Desk
 */

import mongoose, { Schema, HydratedDocument } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import { SafeUser, UserRole } from '@/types'

interface IUserSchema {
    username: string
    email: string
    password: string
    role: UserRole
    isActive: boolean
    lastLogin?: Date
    createdAt: Date
    updatedAt: Date

    comparePassword(candidatePassword: string): Promise<boolean>
    toSafeObject(): SafeUser
}

type UserDocument = HydratedDocument<IUserSchema>

interface UserModel extends mongoose.Model<IUserSchema> {
    findByEmailWithPassword(email: string): Promise<UserDocument | null>
}

const userSchema = new Schema<IUserSchema, UserModel>(
    {
        username: {
            type: String,
            required: [true, 'Имя пользователя обязательно'],
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },

        email: {
            type: String,
            required: [true, 'Email обязателен'],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, 'Пароль обязателен'],
            minlength: 6,
            select: false
        },

        role: {
            type: String,
            enum: ['user', 'support', 'engineer', 'admin'],
            default: 'user'
        },

        isActive: {
            type: Boolean,
            default: true
        },

        lastLogin: {
            type: Date
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

userSchema.index({ email: 1 })
userSchema.index({ username: 1 })
userSchema.index({ role: 1 })

userSchema.pre('save', async function (this: UserDocument, next) {
    if (!this.isModified('password')) return next()

    try {
        const salt = await bcrypt.genSalt(12)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (error) {
        next(error as Error)
    }
})

userSchema.methods['comparePassword'] = async function (
    this: UserDocument,
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods['toSafeObject'] = function (this: UserDocument): SafeUser {
    const userObject = this.toObject() as any
    delete userObject.password
    return userObject as SafeUser
}

userSchema.statics['findByEmailWithPassword'] = function (
    this: UserModel,
    email: string
) {
    return this.findOne({ email }).select('+password')
}

userSchema.virtual('displayName').get(function () {
    return this.username
})

const User = mongoose.model<IUserSchema, UserModel>('User', userSchema)

export default User
export type { IUserSchema as IUser }
