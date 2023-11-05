
import axios from 'axios';
import { firestore } from '../../../../../lib/firebase';
import { Topic } from '../../../../../utils/interfaces/articles';
import { fetchArticles, fetchTopics } from './articles';


export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');

  // Check if the Authorization header exists and matches the valid key
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    const topics: Topic[] = await fetchTopics();
    const articlesCollection = firestore.collection("articles");
    const articles = await fetchArticles(topics);

    articles.forEach(async (article) => {
      articlesCollection.add(article);
      await sendData(`https://${process.env.NEXT_PUBLIC_APP_URL}/api/articles/publish`, article);
    });

    return Response.json({ status: 200, message: "🎉 Success" });
  } else {
    return Response.json({ status: 401, message: "🚫 Unauthorized" });
  }
}

async function sendData(url: string, data: object): Promise<void> {
  try {
    const response = await axios.post(url, data,  {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });
    console.log('Data sent successfully', response.data);
  } catch (error) {
    console.error('Error sending data', error);
  }
}



