'use client'

import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import styles from "../structure/Body.module.css";
import { useEffect, useState } from 'react';
import toast from "react-hot-toast";
import { APP_NAME } from '@/app/layout';
import { firestore } from 'firebase-admin';
import { db } from '@/app/firebase/config';
import { Timestamp } from 'firebase/firestore';
import { getDateIn30Days } from '@/app/utils/dates';

const CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_SLACK_CLIENT_SECRET;

export default function AccessToken() {
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const [token, setToken] = useState("");

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
          .then(response => {
            const responseData = response.data;
            const freeTrialEndDate = getDateIn30Days();
            setToken(responseData['access_token']);

            const workspaceData = {
              "id": responseData['team']['id'],
              "name": responseData['team']['name'],
              "accessToken": responseData['access_token'],
              "premium": false,
              "channelIds": [],
              "language": "English",
              "freeTrialStartDate": Timestamp.now(),
              "freeTrialEndDate": Timestamp.fromDate(freeTrialEndDate),
            };

            db.collection('workspaces').add(workspaceData);
          })
          .catch(error => {
            toast.error(`An error occurred while installing ${APP_NAME} 😔`);
            console.error('An error occurred while retrieving the access token:', error);
          });
        }
      }, [code]);

    return (
        <div className={styles.main}>
            <h1>Access token</h1>
            <p>{token ? `The access token is: ${token}` : 'No access token yet!'}</p>
        </div>
    );
}