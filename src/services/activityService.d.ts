export type ActivityType = 'deal' | 'lead' | 'task' | 'system';
export interface LogActivityInput {
    type: ActivityType;
    action: string;
    details: string;
    /** Override display name; defaults to current user displayName or email */
    user?: string;
}
/**
 * Append an item to the Recent Activity stream (Firestore `recent_activity`).
 * Used when creating/updating deals, viewings, contacts, etc.
 */
export declare function logActivity(input: LogActivityInput): Promise<void>;
