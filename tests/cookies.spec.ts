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

import { test, expect } from './fixtures.js';

test('browser_set_cookies error without redis server', async ({ client, server }) => {
  // First navigate to ensure we have a browser context
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  // Test that the tool fails gracefully when Redis is not available
  const result = await client.callTool({
    name: 'browser_set_cookies',
    arguments: { cookie_key: 'test-cookies' },
  });

  // Should contain error message about Redis connection failure
  expect(result).toContainTextContent('Failed to set cookies from Redis');
});
