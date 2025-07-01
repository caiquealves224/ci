import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';

const LOCAL_ENV_PATH = path.resolve(process.cwd(), '.env');
const EXAMPLE_ENV_PATH = path.resolve(process.cwd(), '.env.example');

function parseEnvFile(filePath: string): Record<string, string> {
  return fs.existsSync(filePath) 
  ? dotenv.parse(fs.readFileSync(filePath, 'utf-8')) 
  : {};
}

async function main() {
  const localEnv = parseEnvFile(LOCAL_ENV_PATH);
  const exampleEnv = parseEnvFile(EXAMPLE_ENV_PATH);

  const localKeys = Object.keys(localEnv);
  const exampleKeys = Object.keys(exampleEnv);

  const missingInExample = localKeys.filter(key => !exampleKeys.includes(key));

  if (missingInExample.length === 0) return process.exit(0);
  
  const newKeysContent = '\n' + missingInExample.map(k => `${k}=`).join('\n') + '\n';

  fs.appendFileSync(EXAMPLE_ENV_PATH, newKeysContent, 'utf-8');
  console.log('✅ .env.example atualizado com sucesso!');
}

main();
