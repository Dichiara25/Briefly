import { Timestamp } from "firebase-admin/firestore";

export interface Workspace {
    id: string,
    name: string,
    channelIds: string[],
    language: string,
    freeTrialStartDate: Timestamp,
    freeTrialEndDate: Timestamp,
}

export interface Channel {
    id: string,
    name: string,
    workspaceId: string,
    language: string,
    live: boolean,
    keywords: string[],
    lastDelivery: Timestamp,
}