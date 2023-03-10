import { MatlabSession } from '../lib';

async function main() {
  const session = new MatlabSession();

  console.log('Initializing Matlab...');
  await session.initialize();
  console.log('Matlab initialized');

  const output = await session.evaluateScript(`
    val=rand(3,3);
    disp(savejson('rand',val))
  `);
  console.log('output', output);
}

main().catch(console.error);
