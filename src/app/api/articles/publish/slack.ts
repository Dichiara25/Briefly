import axios from 'axios';
import { Article, Topic } from '../../../../../utils/interfaces/articles';
import { firestore } from '../../../../../lib/firebase';
import { Divider, Section, Message, Workspace } from '../../../../../utils/interfaces/slack';

export async function formatMessage(article: Article, language: string): Promise<Message[]> {
    const blocks: Message[] = []
    const title = `:rolled_up_newspaper: ${article.title}`
    const topicName = await getTopicName(article.topicId)
    const topic = `:tropical_drink: *Topic*\n${topicName !== undefined ? topicName : article.topicId}`
    const sentiment = ":bubble_tea: *Sentiment*\nGood news :relieved:"
    const summary = `:newspaper: *Summary*\n${article.content}`
    const link = `:link: *Link*\n<${article.link}|Full article (${article.link.split('https://')[1].split('/')[0]})>`

    const titleBlock: Section = {
        'type': 'header',
        'text': {
            'type': 'plain_text',
            'text': title,
        }
    }

    const metadataBlock: Section = {
        type: 'section',
        fields: [
            {
                type: 'mrkdwn',
                text: topic
            },
            {
                type: 'mrkdwn',
                text: sentiment
            }
        ]
    }

    const summaryBlock: Section = {
        type: 'section',
        text: {
            'type': 'mrkdwn',
            'text': summary
        }
    }

    const firstDividerBlock: Divider = {
        type: 'divider',
        block_id: 'divider0'
    }

    const linkBlock: Section = {
        type: 'section',
        text: {
            'type': 'mrkdwn',
            'text': link
        }
    }

    const secondDividerBlock: Divider = {
        type: 'divider',
        block_id: 'divider1'
    }

    blocks.push(titleBlock);
    blocks.push(metadataBlock);
    blocks.push(firstDividerBlock);
    blocks.push(summaryBlock);
    blocks.push(secondDividerBlock);
    blocks.push(linkBlock);

    return blocks;
}

async function getTopicName(topicId: string): Promise<string | undefined> {
    const topics = await firestore.collection("topics").get();

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

export async function fetchWorkspaceLanguage(workspaceId: string): Promise<string> {
    const workspaces = await firestore.collection("workspaces").get();

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

export async function sendMessageToSlackChannel(token: string, channel: string, message: Message[]): Promise<void> {
    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channel,
          text: ":newspaper: A new brief is available",
          blocks: message,
          unfurl_links: false,
          unfurl_media: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
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