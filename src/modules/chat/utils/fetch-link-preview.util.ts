// src/modules/chat/utils/fetch-link-preview.util.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchLinkPreview(url: string) {
  const { data } = await axios.get(url, {
    timeout: 5000,
    headers: { 'User-Agent': 'Discordbot/2.0' },
  });

  const $ = cheerio.load(data);

  return {
    url,
    title:
      $('meta[property="og:title"]').attr('content') ??
      $('title').text(),
    description:
      $('meta[property="og:description"]').attr('content'),
    imageUrl:
      $('meta[property="og:image"]').attr('content'),
    siteName:
      $('meta[property="og:site_name"]').attr('content'),
  };
}