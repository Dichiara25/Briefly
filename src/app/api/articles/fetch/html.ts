
import axios from 'axios';
import { JSDOM } from 'jsdom';

export async function parseHTMLFromURL(url: string): Promise<string[]> {
    // Fetch the content from the given URL
    const response = await axios.get(url);

    // Use JSDOM to parse the HTML content
    const dom = new JSDOM(response.data);

    // Query for all <p> elements
    const paragraphs = dom.window.document.querySelectorAll('p');

    // Extract text from each <p> element
    const content: string[] = [];
    paragraphs.forEach(p => {
      content.push(p.textContent || "");
    });

    return content;
  }
