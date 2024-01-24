import * as admin from 'firebase-admin';
import { Timestamp } from "firebase-admin/firestore";
import { Topic } from './rss';

require('dotenv').config();

export interface Workspace {
  id: string,
  accessToken: string,
  premium: boolean,
  name: string,
  channelIds: string[],
  language: string,
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

export async function getTopicName(topicId: string): Promise<string | undefined> {
  const topics = await db.collection("topics").get();

  if (!topics.empty) {
      for (const topic of topics.docs) {
          if (topic.exists) {
              if (topic.id === topicId) {
                  const data = topic.data() as Topic;
                  return data.name;
              }
          }
      }
  }

  return undefined;
}

export async function getWorkspaceLanguage(workspaceId: string): Promise<string> {
  const workspaces = await db.collection("workspaces").get();

  if (!workspaces.empty) {
      for (const workspace of workspaces.docs) {
          if (workspace.exists) {
              if (workspace.id === workspaceId) {
                  const data = workspace.data() as Workspace;
                  return data.language;
              }
          }
      }
  }

  return "English";
}

