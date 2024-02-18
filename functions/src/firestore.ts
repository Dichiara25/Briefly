import * as admin from 'firebase-admin';
import { CollectionReference, Timestamp } from "firebase-admin/firestore";

require('dotenv').config();

export interface Channel {
    id: string,
    topicIds: string[]
}

export interface PendingTeam {
    id: string,
    accessToken: string,
    name: string,
    channel: string,
    language: string,
    keywords: string[],
}

export interface TeamId {
    id: string,
}

export interface Team {
  accessToken: string,
  premium: boolean,
  name: string,
  deliveryCounter: number,
  freeTrialStartDate: Timestamp,
  freeTrialEndDate: Timestamp,
}

const firebaseType = process.env.SERVICE_ACCOUNT_TYPE;
const firebaseProjectId = process.env.SERVICE_ACCOUNT_PROJECT_ID;
const firebaseProjectKeyId = process.env.SERVICE_ACCOUNT_PRIVATE_KEY_ID;
const firebasePrivateKey = (process.env.SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const firebaseClientEmail = process.env.SERVICE_ACCOUNT_CLIENT_EMAIL;
const firebaseClientId = process.env.SERVICE_ACCOUNT_CLIENT_ID;
const firebaseAuthURI = process.env.SERVICE_ACCOUNT_AUTH_URI;
const firebaseTokenURI = process.env.SERVICE_ACCOUNT_TOKEN_URI;
const firebaseAuthProviderCertUrl = process.env.SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL;
const firebaseClientCertUrl = process.env.SERVICE_ACCOUNT_CLIENT_X509_CERT_URL;

const serviceAccount = {
    type: firebaseType,
    project_id: firebaseProjectId,
    private_key_id: firebaseProjectKeyId,
    private_key: firebasePrivateKey,
    client_email: firebaseClientEmail,
    client_id: firebaseClientId,
    auth_uri: firebaseAuthURI,
    token_uri: firebaseTokenURI,
    auth_provider_x509_cert_url: firebaseAuthProviderCertUrl,
    client_x509_cert_url: firebaseClientCertUrl,
};

if (admin.apps.length === 0) {
  admin.initializeApp({
      // @ts-ignore
      credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();

export async function getAccessToken(teamId: string): Promise<string | null> {
    const workspaceDocument = await db.collection('teams').doc(teamId).get();

    if (workspaceDocument.exists) {
        const data = workspaceDocument.data() as Team;
        return data.accessToken;
    }

    return null;
}

export async function setField(documentId: string, field: string, value: string | string[] | boolean | number) {
    return db
    .collection("teams")
    .doc(documentId)
    .collection("settings")
    .doc(field)
    .set({value: value}, {merge: true});
}

export async function getSettingValue(documentId: string, field: string): Promise<any> {
    const document = await db
        .collection("teams")
        .doc(documentId)
        .collection("settings")
        .doc(field)
        .get();

    if (document.exists) {
        const data = document.data();
        return data ? data.value : null;
    }

    return null;
}