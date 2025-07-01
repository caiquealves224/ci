import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { execSync } from 'child_process';

const LOCAL_ENV_PATH = path.resolve(process.cwd(), '.env');
const EXAMPLE_ENV_PATH = path.resolve(process.cwd(), '.env.example');
const SLACK_WEBHOOK_URL = 'URL_DO_WEBHOOK';

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Arquivo não encontrado: ${filePath}`);
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return dotenv.parse(content);
}

async function notifySlack(missingKeys: string[]) {
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({text: 
        `:warning: Atenção, Time! *Novas variáveis de ambiente* foram adicionadas ao *Jusbill* \n\n
        ${missingKeys.map(key => `• \`${key}=\``).join('\n')}`
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API response error: ${response.status} - ${await response.text()}`);
    }

    console.log('📣 Notificação enviada para o Slack com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao enviar notificação para o Slack:', (error as Error).message);
  }
}

function getRemoteBranch(): string {
  try {
    // git show-ref --verify --quiet verifica se a referência existe sem saída de texto,
    // retornando 0 para sucesso (existe) e diferente de 0 para falha (não existe).
    execSync(`git fetch origin && git show-ref --verify --quiet refs/remotes/origin/$(git rev-parse --abbrev-ref HEAD)`);
    return '$(git rev-parse --abbrev-ref HEAD)'; // A branch existe no origin
  } catch (error) {
    return 'main'; // A branch não existe ou outro erro ocorreu
  }
}

async function main() {
  const localEnv = parseEnvFile(LOCAL_ENV_PATH);
  const exampleEnv = parseEnvFile(EXAMPLE_ENV_PATH);

  const localKeys = Object.keys(localEnv);
  const exampleKeys = Object.keys(exampleEnv);

  const missingInExample = localKeys.filter(key => !exampleKeys.includes(key));
  const missingInLocal = exampleKeys.filter(key => !localKeys.includes(key));

  const syncMode = process.argv.includes('--sync');

  if (missingInLocal.length > 0) {
    console.warn('⚠️  Variáveis no .env.example que estão faltando no seu .env:\n' + missingInLocal.join('\n'));
  }

  if (syncMode && missingInExample.length > 0) {
    const newKeysContent = '\n' + missingInExample.map(k => `${k}=`).join('\n') + '\n';

    try {
      fs.appendFileSync(EXAMPLE_ENV_PATH, newKeysContent, 'utf-8');
      console.log('✅ .env.example atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao adicionar chaves ao .env.example:', error);
      process.exit(1);
    }
  }

  const exampleEnvAtualizado = [
    ...exampleKeys,
    ...missingInExample,
  ]

  const originKeys = Object.keys(dotenv.parse(
    execSync(`
      git show origin/${getRemoteBranch()}:.env.example`,
      { encoding: 'utf-8' },
    )
  ));

  const missingInOrign = exampleEnvAtualizado.filter(key => !originKeys.includes(key));

  if (missingInOrign.length > 0) {
    console.warn(`⚠️ Novas variáveis no .env.example:\n${missingInOrign.map(key => `• \`${key}=\``).join('\n')}`);

    await notifySlack(missingInOrign);
  }

  process.exit(0);
}

main();
