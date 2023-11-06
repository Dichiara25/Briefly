import { Timestamp } from "firebase-admin/firestore";

export interface Workspace {
    id: string,
    premium: boolean,
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

export interface Text {
    type: string,
    text: string
}

export interface Message {
    type: string,
    text?: Text,
    fields?: Text[],
    block_id?: string
}

export interface Section {
    type: string,
    text?: Text,
    fields?: Text[],
}

export interface Divider {
    type: string,
    block_id: string
}