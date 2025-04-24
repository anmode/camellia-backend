// jest.global-setup.ts
import { execSync } from 'child_process';
export default () => {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
};
