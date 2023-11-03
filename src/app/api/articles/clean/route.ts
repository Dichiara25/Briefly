import { firestore } from "../../../../../lib/firebase";
import { Article } from "../../../../../utils/interfaces/articles";
import { daysBetweenDates } from "../../../../../utils/dates";

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');

    // Check if the Authorization header exists and matches the valid key
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
        const articles = await firestore.collection("articles").get();
        const today = new Date();

        articles.forEach((article) => {
            if (article.exists) {
                const data = article.data() as Article;
                const pubDate: Date = new Date(data.pubDate);
                const daysDifference: number = daysBetweenDates(today, pubDate);

                if (daysDifference > 7) {
                    const articleReference = article.ref;
                    articleReference.delete();
                }
            }
        })

        return Response.json({ status: 200, message: "🎉 Success" });
    } else {
        return Response.json({ status: 401, message: "🚫 Unauthorized" });
    }
}