export type IncidentStatus =
    | 'new'           // (Вместо Incoming)
    | 'investigating' // (Вместо In Progress)
    | 'identified'
    | 'monitoring'
    | 'resolved'
    | 'closed';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {

    _id: string
    incidentNumber?: string
    title: string
    description?: string
    status: string
    severity?: "low" | "medium" | "high" | "critical"
    type?: "hardware" | "software" | "network" | "security" | "other"
    ticketId?: string
    createdAt?: string
    updatedAt?: string

}