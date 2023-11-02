export interface Article {
    title: string;
    topicId: string;
    link: string;
    content: string;
    pubDate: string;
    summary: string;
}

export interface RssObject {
    title: string;
    link: string;
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