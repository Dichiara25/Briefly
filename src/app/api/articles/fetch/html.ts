
import axios from 'axios';
import cheerio from 'cheerio';

export async function parseHTMLFromURL(url: string): Promise<string[]> {
    // Fetch the content from the given URL
    const response = await axios.get(url);

    // Use cheerio to parse the HTML content
    const $ = cheerio.load(response.data);

    // Query for all <p> elements
    const paragraphs = $('p');

    // Extract text from each <p> element
    const content: string[] = [];
    paragraphs.each((_, p) => {
      content.push($(p).text());
    });

    return content;
}