/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';
import { createClient } from 'redis';
import { defineTool } from './tool.js';

const setCookies = defineTool({
  capability: 'core',

  schema: {
    name: 'browser_set_cookies',
    title: 'Set cookies from Redis',
    description: 'Load a cookie jar from a Redis server using the specified key and set cookies in the browser context',
    inputSchema: z.object({
      cookie_key: z.string().describe('The Redis key to load the cookie jar from'),
    }),
    type: 'destructive',
  },

  handle: async (context, params) => {
    // Get Redis connection configuration from environment variables
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

    let client;
    try {
      // Create Redis client
      if (redisUrl) {
        client = createClient({ url: redisUrl });
      } else {
        client = createClient({
          socket: {
            host: redisHost,
            port: redisPort,
          },
          password: redisPassword,
          database: redisDb,
        });
      }

      // Connect to Redis
      await client.connect();

      // Get the cookie jar from Redis
      const cookieData = await client.get(params.cookie_key);

      if (!cookieData)
        throw new Error(`No cookie data found for key: ${params.cookie_key}`);

      // Parse the cookie data (expecting JSON format)
      let cookies;
      try {
        cookies = JSON.parse(cookieData);
      } catch (parseError) {
        throw new Error(`Invalid JSON format for cookie data: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Ensure cookies is an array
      if (!Array.isArray(cookies))
        throw new Error('Cookie data must be an array of cookie objects');

      // Get browser context and add cookies
      const tab = await context.ensureTab();
      const browserContext = tab.page.context();

      await browserContext.addCookies(cookies);

      const code = [
        `// Load cookies from Redis key: ${params.cookie_key}`,
        `// Added ${cookies.length} cookies to browser context`,
        `await context.addCookies(${JSON.stringify(cookies, null, 2)});`
      ];

      return {
        code,
        captureSnapshot: false,
        waitForNetwork: false,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to set cookies from Redis: ${errorMessage}`);
    } finally {
      // Clean up Redis connection
      if (client && client.isOpen)
        await client.disconnect();
    }
  },
});

export default [
  setCookies,
];
