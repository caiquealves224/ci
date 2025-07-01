import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';

const LOCAL_ENV_PATH = path.resolve(process.cwd(), '.env');
const EXAMPLE_ENV_PATH = path.resolve(process.cwd(), '.env.example');

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Arquivo não encontrado: ${filePath}`);
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return dotenv.parse(content);
}

async function main() {
  const localEnv = parseEnvFile(LOCAL_ENV_PATH);
  const exampleEnv = parseEnvFile(EXAMPLE_ENV_PATH);

  const localKeys = Object.keys(localEnv);
  const exampleKeys = Object.keys(exampleEnv);

  const missingInExample = localKeys.filter(key => !exampleKeys.includes(key));
  const missingInLocal = exampleKeys.filter(key => !localKeys.includes(key));

  if (missingInLocal.length > 0) {
    console.warn('⚠️  Variáveis no .env.example que estão faltando no seu .env:\n' + missingInLocal.join('\n'));
  }

  if (missingInExample.length === 0) return process.exit(0);
  
  const newKeysContent = '\n' + missingInExample.map(k => `${k}=`).join('\n') + '\n';

  fs.appendFileSync(EXAMPLE_ENV_PATH, newKeysContent, 'utf-8');
  console.log('✅ .env.example atualizado com sucesso!');
}

main();
