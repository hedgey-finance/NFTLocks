const happyPath = require('./tests/happyPath');
const { unlockTests, unlockErrorTests } = require('./tests/unlockTests');
const { lockTests, lockErrorTests } = require('./tests/lockTests');
const { transferTests, transferErrorTests } = require('./tests/transferTests');

describe('Testing the Happy Path', () => {
  happyPath();
});

describe('Testing the core Lock Functions', () => {
  lockTests();
  lockErrorTests();
});
