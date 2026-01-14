// src/modules/chat/services/link-preview.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class LinkPreviewService {
  private readonly logger = new Logger(LinkPreviewService.name);

  async fetch(url: string) {
    try {
      const { data } = await axios.get(url, {
        timeout: 5000,
        maxRedirects: 3,
        headers: {
          'User-Agent': 'FourierBot/1.0',
        },
      });

      const $ = cheerio.load(data);

      const get = (prop: string) =>
        $(`meta[property="${prop}"]`).attr('content');

      return {
        url,
        title:
          get('og:title') ||
          $('title').text() ||
          undefined,
        description:
          get('og:description') ||
          $('meta[name="description"]').attr('content') ||
          undefined,
        imageUrl: get('og:image'),
        siteName: get('og:site_name'),
      };
    } catch (e) {
      this.logger.warn(`Link preview failed: ${url}`);
      return null;
    }
  }
}