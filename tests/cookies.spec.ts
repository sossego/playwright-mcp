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
