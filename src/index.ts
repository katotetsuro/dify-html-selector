import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import * as cheerio from 'cheerio';

const app = new OpenAPIHono();

export default app;

const route = createRoute({
  path: '/',
  method: 'post',
  description: 'fetch html, return selected part, strip css classes',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            url: z.string().openapi({
              example: 'https://example.com',
              description: 'url',
            }),
            selector: z.string().openapi({
              example: 'body',
              description: 'selector',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: z.object({
            result: z.string().openapi({
              example: '<div>hello</div>',
              description: 'html',
            }),
          }),
        },
      },
    },
  },
});

app.openapi(route, async context => {
  const params = context.req.valid('json');

  const res = await fetch(params.url);
  const html = await res.text();
  try {
    const $ = cheerio.load(html);
    $('*').removeAttr('class');
    // $('*').removeAttr('id');    
    $('script').remove();
    $('style').remove();
    $('svg').remove();

    return context.json({ result: $(params.selector).html() || '', error: '' });
  } catch (e) {
    return context.json({ result: '', error: `failed to get html: ${e}` });
  }

}).doc('/specification', {
  openapi: '3.0.0',
  info: {
    title: 'dify custom tool html subtree selector',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://dify-html-selector.tkato.workers.dev',
    },
  ],
});;``