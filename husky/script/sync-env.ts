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

  const missingInLocal = exampleKeys.filter(key => !localKeys.includes(key));

  if (missingInLocal.length === 0) return process.exit(0);

  console.warn('⚠️  Variáveis no .env.example que estão faltando no seu .env:\n' + missingInLocal.join('\n'));
  
  const newKeysContent = '\n' + missingInLocal.map(k => `${k}=`).join('\n') + '\n';

  fs.appendFileSync(LOCAL_ENV_PATH, newKeysContent, 'utf-8');
  console.log('✅ .env.example atualizado com sucesso!');
}

main();
