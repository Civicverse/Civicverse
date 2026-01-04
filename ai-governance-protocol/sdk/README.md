AI Governance SDK — JavaScript Example

This small SDK shows how to call the evaluator and attest endpoints from a Node.js app or browser (using fetch).

Files:
- `client.js` — minimal client wrapper.

Usage (Node):

```js
const Client = require('./client');
const c = new Client({ baseUrl: 'http://localhost:4310' });
await c.fryboyEval('I endorse CivicVerse', 'my-model');
```
