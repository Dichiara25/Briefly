import axios from 'axios';
import { Article, Topic } from '../../../../../utils/interfaces/articles';
import { firestore } from '../../../../../lib/firebase';

interface Text {
    type: string,
    text: string
}

interface Message {
    type: string,
    text?: Text,
    fields?: Text[],
    block_id?: string
}

interface Section {
    type: string,
    text?: Text,
    fields?: Text[],
}

interface Divider {
    type: string,
    block_id: string
}

export async function formatMessage(article: Article): Promise<Message[]> {
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
                console.log(topic.id === topicId);
                if (topic.id.toString().trim() === topicId.toString().trim()) {
                    const data = topic.data() as Topic;
                    return data.name;
                }
            }
        }
    }

    return undefined;
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