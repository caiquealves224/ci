import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

const SLACK_WEBHOOK_URL = 'URL_WEBHOOK';

async function notifySlack(missingKeys: string[]) {
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 
        `:warning: Atenção, Time! *Novas variáveis de ambiente* foram adicionadas ao *Jusbill* \n \n${missingKeys.map(key => `• \`${key}=\``).join('\n')}`
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
    execSync(`git show-ref --verify --quiet refs/remotes/origin/$(git rev-parse --abbrev-ref HEAD)`);
    return '$(git rev-parse --abbrev-ref HEAD)'; // A branch existe no origin
  } catch (error) {
    return 'main'; // A branch não existe ou outro erro ocorreu
  }
}

async function main() {
  const exampleKeys = Object.keys(dotenv.parse(
    execSync('git show :".env.example"', { encoding: 'utf-8' }),
  ));

  const originKeys = Object.keys(dotenv.parse(
    execSync(`
      git show origin/${getRemoteBranch()}:.env.example`,
      { encoding: 'utf-8' },
    )
  ));

  const missingInOrign = exampleKeys.filter(key => !originKeys.includes(key));

  if (missingInOrign.length > 0) {
    console.warn(`⚠️ Novas variáveis no .env.example:\n${missingInOrign.map(key => `• \`${key}=\``).join('\n')}`);

    await notifySlack(missingInOrign);
  }

  process.exit(0);
}

main();
