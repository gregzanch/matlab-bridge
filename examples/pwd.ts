import { MatlabSession } from '../lib';

async function main() {
  const session = new MatlabSession();
  await session.initialize();

  console.log('Matlab initialized');

  const output = await session.evaluateScript(`
    pwd
  `);
  console.log('output', output);
}

main().catch(console.error);
