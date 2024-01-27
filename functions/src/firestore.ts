import * as admin from 'firebase-admin';
import { Timestamp } from "firebase-admin/firestore";
import { Topic } from './rss';

require('dotenv').config();

export interface Channel {
    id: string,
    name: string,
    topicIds: string[]
}

export interface PendingWorkspace {
    id: string,
    accessToken: string,
    name: string,
    channels: Channel[],
    language: string,
}

export interface WorkspaceId {
    id: string,
}

export interface AcceptedWorkspace {
  accessToken: string,
  premium: boolean,
  name: string,
  language: string,
  live: boolean,
  channels: Channel[],
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

