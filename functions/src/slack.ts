import axios from 'axios';
import { Block } from './messages';

require('dotenv').config();

const slackOAuthToken = process.env.SLACK_OAUTH_TOKEN as string;

export async function sendMessageToSlackChannel(channel: string, blocks: Block[]): Promise<void> {

    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channel,
          text: ":newspaper: A new brief is available",
          blocks: blocks,
          unfurl_links: false,
          unfurl_media: false,
        },
        {
          headers: {
            Authorization: `Bearer ${slackOAuthToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ok) {
        console.log('Message sent successfully.');
      } else {
        console.error('Failed to send message:', response.data.error);
      }
    } catch (error: any) {
      console.error('Error sending message:', error.message);
    }
}