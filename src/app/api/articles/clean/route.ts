import { firestore } from "../../../../../lib/firebase";

export async function GET(req: Request) {
    const authHeader = req.headers.get('Authorization');

    // Check if the Authorization header exists and matches the valid key
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
      const articlesCollection = firestore.collection("articles");

      return Response.json({ status: 200, message: "🎉 Success" });
    } else {
      return Response.json({ status: 401, message: "🚫 Unauthorized" });
    }
  }