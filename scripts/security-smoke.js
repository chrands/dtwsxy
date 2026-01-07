const fs = require('fs');
const path = require('path');

const root = process.cwd();
const cache = new Map();

function readFile(file) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    return { error: 'missing file' };
  }
  if (!cache.has(file)) {
    cache.set(file, fs.readFileSync(fullPath, 'utf8'));
  }
  return { content: cache.get(file) };
}

const failures = [];
const checks = [];

function expectMatch(file, regex, message) {
  checks.push({ file, regex, message, type: 'match' });
}

function expectNotMatch(file, regex, message) {
  checks.push({ file, regex, message, type: 'notMatch' });
}

expectMatch('src/lib/auth.ts', /async\s+getActiveUser\s*\(/, 'missing getActiveUser');
expectMatch('src/lib/auth.ts', /status\s*:\s*true/, 'getActiveUser should query user status');
expectMatch('src/lib/auth.ts', /user\.status\s*!==\s*'ACTIVE'/, 'getActiveUser should block inactive users');

expectMatch('src/app/api/users/route.ts', /getActiveUser\s*\(/, 'users list should require auth');
expectMatch('src/app/api/users/route.ts', /requireRole\([^,]+,\s*\['ADMIN'\]\)/, 'users list should be admin-only');

expectMatch('src/app/api/users/[id]/route.ts', /getActiveUser\s*\(/, 'user detail should require auth');
expectMatch('src/app/api/users/[id]/route.ts', /ResponseHelper\.forbidden/, 'user detail should enforce ownership/admin');
expectMatch('src/app/api/users/[id]/route.ts', /softDeleteUser\s*\(/, 'user delete should be soft delete');
expectNotMatch('src/app/api/users/[id]/route.ts', /UserService\.deleteUser\s*\(/, 'user detail should not hard delete');

expectMatch('src/app/api/posts/route.ts', /getActiveUser\s*\(/, 'post creation should require auth');
expectMatch('src/app/api/posts/route.ts', /authorId\s*:\s*currentUser/, 'post authorId should derive from current user');

expectMatch('src/app/api/doctors/route.ts', /getActiveUser\s*\(/, 'doctor creation should require auth');
expectMatch('src/app/api/doctors/route.ts', /userId\s*:\s*currentUser/, 'doctor userId should derive from current user');

expectMatch('src/app/api/orders/route.ts', /getActiveUser\s*\(/, 'orders should require auth');

expectMatch('src/app/api/auth/me/route.ts', /getActiveUser\s*\(/, 'auth me should require active user');

expectMatch('src/modules/post/post.service.ts', /prisma\.post\.count\s*\(/, 'post list should count posts');
expectNotMatch('src/modules/post/post.service.ts', /prisma\.order\.count\s*\(/, 'post list should not count orders');
expectMatch('src/modules/post/post.service.ts', /status\s*=\s*\{\s*not:\s*'DELETED'\s*\}/, 'post list should exclude deleted by default');

expectMatch('next.config.mjs', /ALLOWED_ORIGINS/, 'CORS should use ALLOWED_ORIGINS');
expectNotMatch('next.config.mjs', /Access-Control-Allow-Origin[^\n]*\*['"]/, 'CORS should not allow wildcard origin');

for (const check of checks) {
  const result = readFile(check.file);
  if (result.error) {
    failures.push(`${check.file}: ${result.error}`);
    continue;
  }

  const ok = check.regex.test(result.content);
  if (check.type === 'match' && !ok) {
    failures.push(`${check.file}: ${check.message}`);
  }
  if (check.type === 'notMatch' && ok) {
    failures.push(`${check.file}: ${check.message}`);
  }
}

if (failures.length) {
  console.error('Security smoke checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Security smoke checks passed: ${checks.length} checks`);
