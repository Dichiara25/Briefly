'use client'

import { useSearchParams, redirect } from 'next/navigation';
import axios from 'axios';
import styles from "../structure/Body.module.css";
import { useEffect, useState } from 'react';
import toast from "react-hot-toast";
import { APP_NAME } from '@/app/layout';
import { db } from '@/app/firebase/config';
import { routes } from '@/app/routes';
import { getAvailableTopics } from '@/app/firebase/topics';

const CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_SLACK_CLIENT_SECRET;

export interface Channel {
  id: string,
  topicIds: string[]
}

export interface PendingWorkspace {
  id: string,
  accessToken: string,
  name: string,
  channel: string,
  language: string,
  keywords: string[],
}

export default function AccessToken(props: {availableTopics: string[]}) {
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const [token, setToken] = useState("");
    const [language] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("language") || "English"
        } else {
            return "English"
        }
    });
    const [channel] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem("channel") || "#general"
      } else {
          return "#general"
      }
  });
  const [keywords, setKeywords] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem("keywords") || ""
    } else {
        return ""
    }
  });

  useEffect(() => {
      if (code) {
        // Create a FormData object
        const formData = new FormData();
        formData.append('code', code as string);
        formData.append('client_id', CLIENT_ID as string);
        formData.append('client_secret', CLIENT_SECRET as string);

        axios.post('https://slack.com/api/oauth.v2.access', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(async response => {
          const responseData = response.data;
          const teamId = responseData['team']['id'];
          const existingWorkspaceIds = await db
            .collection('workspacesIds')
            .get()
            .then((docs) => {
              if (!docs.empty) {
                const array: string[] = [];
                docs.forEach((doc) => {
                  if (doc.exists) {
                    array.push(doc.id);
                  }
                });

                return array;
              }
          })

          if (!existingWorkspaceIds?.includes(teamId)) {
            setToken(responseData['access_token']);

            const workspaceData: PendingWorkspace = {
              "id": teamId,
              "name": responseData['team']['name'],
              "accessToken": responseData['access_token'],
              "keywords": keywords.split(/[,\s\-\/]/),
              "channel": channel,
              "language": language,
            };

            db
              .collection('pendingWorkspaces')
              .doc(teamId)
              .set(workspaceData)
              .then(() => {
                toast.success(`Thanks for installing ${APP_NAME} 🔥`);
              });
          } else {
            toast.error(`It seems ${APP_NAME} is already installed in this workspace 🤔`);
          }
        })
        .catch(error => {
          toast.error(`An error occurred 😔`);
          console.error('An error occurred while retrieving the access token:', error);
        });

        redirect(routes.home);
      }
    }, [code]);

  return (
      <div className={styles.main}>
          <h1>Thanks for installing {APP_NAME}</h1>
          <p>{token ? 'You are going to be redirected...' : 'Please wait...'}</p>
      </div>
  );
}