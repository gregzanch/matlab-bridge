import { MatlabSession } from '../lib';

async function main() {
  const session = new MatlabSession();

  console.log('Initializing Matlab...');
  await session.initialize();
  console.log('Matlab initialized');

  const output = await session.evaluateScript(`
    a = linspace(1, 25, 25)';
    b = a.*2;
    jsonencode(b)
    result.a = a;
    result.b = b;
    jsonencode(result)
  `);
  console.log('output', output);
  const workspace = await session.getWorkspace();
  console.log('workspace', workspace);
}

main().catch(console.error);
