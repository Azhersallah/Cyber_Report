const concurrently = require('concurrently');

const { result } = concurrently([
  { command: 'npx vite', name: 'vite', prefixColor: 'blue' },
  { command: 'npx wait-on http://localhost:3000 && npx electron .', name: 'electron', prefixColor: 'green' }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 0,
});

result.then(
  () => process.exit(0),
  () => process.exit(1)
);
