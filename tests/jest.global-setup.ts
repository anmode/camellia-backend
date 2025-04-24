import { execSync } from 'node:child_process';

export default async () => {
  process.env.DOTENV_CONFIG_PATH = '.env.test';
  execSync(
    'dotenv -e .env.test -- prisma migrate reset --force --skip-seed',
    { stdio: 'inherit' }
  );
};
