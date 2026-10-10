import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
mkdirSync('.local', {recursive:true, mode:0o700});
chmodSync('.local', 0o700);
const env = {...process.env};
const java = '/opt/homebrew/opt/openjdk@21';
if (!env.JAVA_HOME && existsSync(`${java}/bin/java`)) env.JAVA_HOME = java;
if (env.JAVA_HOME) env.PATH = `${env.JAVA_HOME}/bin:${env.PATH}`;
env.XDG_CONFIG_HOME = resolve('.local/config');
env.FIREBASE_EMULATORS_PATH = resolve('.local/emulators');
env.CI = 'true';
mkdirSync(env.XDG_CONFIG_HOME, {recursive: true});
mkdirSync(env.FIREBASE_EMULATORS_PATH, {recursive: true});
const mode = process.argv[2];
if (mode === 'billing') {
  const config = JSON.parse(readFileSync('firebase.json', 'utf8'));
  config.emulators = {auth:{host:'127.0.0.1',port:9190},functions:{host:'127.0.0.1',port:5101},storage:{host:'127.0.0.1',port:19399},firestore: {host:'127.0.0.1',port:8180,websocketPort:9250},hub:{host:'127.0.0.1',port:4480},logging:{host:'127.0.0.1',port:4580},ui:{enabled:false},singleProjectMode:true};
  writeFileSync('.firebase.test.local.json', JSON.stringify(config));
}
const args = mode === 'billing'
  ? ['emulators:exec', '--config', '.firebase.test.local.json', '--project','demo-casa-billing','node --test backend/functions/test/billing.integration.cjs backend/functions/test/finance.integration.cjs backend/functions/test/household.integration.cjs backend/functions/test/system-settings.integration.cjs backend/functions/test/audit-log.integration.cjs backend/functions/test/internet-lifecycle.integration.cjs backend/functions/test/occupancy.integration.cjs backend/functions/test/internet-admin.integration.cjs tests/security/rules.test.mjs']
  : mode === 'smoke'
  ? ['emulators:exec', '--project', 'demo-casa-local', 'node scripts/smoke.mjs']
  : mode === 'test'
  ? ['emulators:exec', '--only', 'firestore', '--project', 'demo-casa-local', 'node --test tests/security/rules.test.mjs']
  : ['emulators:start', '--project', 'demo-casa-local', '--export-on-exit', '.local/emulator-data', ...(existsSync('.local/emulator-data/firebase-export-metadata.json') ? ['--import', '.local/emulator-data'] : [])];
const result = spawnSync(resolve('node_modules/.bin/firebase'), args, {env, stdio: 'inherit'});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
