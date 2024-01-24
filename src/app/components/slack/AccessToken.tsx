'use client'

import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import styles from "../structure/Body.module.css";
import { useEffect, useState } from 'react';
import toast from "react-hot-toast";
import { APP_NAME } from '@/app/layout';

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
            setToken(response.data['access_token']);
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