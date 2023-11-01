export interface Article {
    title: string;
    link: string;
    description: string;
    topicId: string;
    content?: string | null;
    pubDate: string;
  }

export interface RssChannel {
    item: Article[];
}

export interface RssRootObject {
    rss: {
        channel: RssChannel[];
    };
}

export interface Topic {
    id?: string,
    name: string,
    feeds: string[],
    subscribers: number
}