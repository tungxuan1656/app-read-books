#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const EFFECT_FLAGS = {
  network: '--allow-network',
  writes: '--allow-writes',
  services: '--allow-services',
  installs: '--allow-installs',
  secrets: '--allow-secrets'
};
const EFFECT_KEYS = Object.keys(EFFECT_FLAGS);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function usage() {
  console.log('Usage: node harness/scripts/run-checks.mjs [repo-root] (--quick | --profile quick|full) [--allow-network ...]');
}

function parseArgs(args) {
  let rootArg;
  let profile = 'quick';
  let explicitProfile;
  const allowed = new Set();
  const knownFlags = new Set(Object.values(EFFECT_FLAGS));
  const chooseProfile = (nextProfile) => {
    if (explicitProfile !== undefined && explicitProfile !== nextProfile) {
      throw new Error(`conflicting profile selection: ${explicitProfile} and ${nextProfile}`);
    }
    explicitProfile = nextProfile;
    profile = nextProfile;
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help') return {help: true};
    if (arg === '--quick') {
      chooseProfile('quick');
    } else if (arg === '--profile') {
      const requestedProfile = args[++index];
      if (!requestedProfile || requestedProfile.startsWith('--')) throw new Error('--profile requires quick or full');
      if (!['quick', 'full'].includes(requestedProfile)) throw new Error('--profile must be quick or full');
      chooseProfile(requestedProfile);
    } else if (knownFlags.has(arg)) {
      allowed.add(arg);
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown option ${arg}`);
    } else if (rootArg === undefined) {
      rootArg = arg;
    } else {
      throw new Error(`unexpected argument ${arg}`);
    }
  }
  if (!['quick', 'full'].includes(profile)) throw new Error('--profile must be quick or full');
  return {rootArg, profile, allowed};
}

function readChecks(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'harness', 'checks.json'), 'utf8'));
  } catch (error) {
    throw new Error(`cannot load harness/checks.json: ${error.message}`);
  }
}

function runChild(argv, cwd, label, timeoutMs) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    let killTimer;
    let timer;
    const append = (current, chunk) => current.length >= 1000000 ? current : `${current}${chunk.toString('utf8')}`.slice(0, 1000000);
    let child;
    try {
      child = spawn(argv[0], argv.slice(1), {cwd, env: process.env, shell: false, stdio: ['ignore', 'pipe', 'pipe']});
    } catch (error) {
      resolve({argv, cwd, startedAt, endedAt: new Date().toISOString(), durationMs: Date.now() - startTime, stdout, stderr: error.message, exitCode: null, signal: null, timedOut: false});
      return;
    }
    const finish = (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve({argv, cwd, startedAt, endedAt: new Date().toISOString(), durationMs: Date.now() - startTime, stdout, stderr, exitCode, signal, timedOut});
    };
    child.stdout.on('data', (chunk) => {
      stdout = append(stdout, chunk);
      process.stdout.write(`[${label}] ${chunk.toString()}`);
    });
    child.stderr.on('data', (chunk) => {
      stderr = append(stderr, chunk);
      process.stderr.write(`[${label} stderr] ${chunk.toString()}`);
    });
    child.on('error', (error) => {
      stderr = append(stderr, error.message);
      finish(null, null);
    });
    child.on('close', (code, signal) => finish(code, signal));
    timer = setTimeout(() => {
      timedOut = true;
      process.stderr.write(`[${label}] timeout after ${timeoutMs}ms; sending SIGTERM\n`);
      child.kill('SIGTERM');
      killTimer = setTimeout(() => child.kill('SIGKILL'), 1000);
    }, timeoutMs);
  });
}

function ensureInside(rootReal, candidate, label) {
  const relative = path.relative(rootReal, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`${label} resolves outside repository root`);
}

function safeReceiptsDirectory(root, rootReal) {
  let current = root;
  for (const part of ['harness', 'work', 'receipts']) {
    current = path.join(current, part);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error(`${path.relative(root, current)} is a symlink`);
      if (!stat.isDirectory()) throw new Error(`${path.relative(root, current)} is not a directory`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      fs.mkdirSync(current);
    }
  }
  ensureInside(rootReal, fs.realpathSync(current), 'receipt directory');
  return current;
}

function writeReceipt(root, rootReal, result, check, profile) {
  const directory = safeReceiptsDirectory(root, rootReal);
  const filename = `${Date.now()}-${process.pid}-${process.hrtime.bigint()}-${check.id}.json`;
  const destination = path.join(directory, filename);
  ensureInside(rootReal, destination, 'receipt path');
  const receipt = {
    schemaVersion: 1,
    checkId: check.id,
    profile,
    argv: result.argv,
    cwd: path.relative(root, result.cwd) || '.',
    quick: check.quick,
    requiredByDefault: check.requiredByDefault,
    declaredEffects: check.declaredEffects,
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    stdout: result.stdout,
    stderr: result.stderr
  };
  fs.writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`, {flag: 'wx'});
  return path.relative(root, destination);
}

async function invokeValidator(root) {
  const validator = path.join(scriptDir, 'validate.mjs');
  const result = await runChild([process.execPath, validator, root], root, 'harness-validator', 120000);
  return result.exitCode === 0 && !result.timedOut;
}

function assertEffectApproval(check, allowed) {
  for (const effect of EFFECT_KEYS) {
    if (check.declaredEffects[effect] === true && !allowed.has(EFFECT_FLAGS[effect])) {
      throw new Error(`full profile refuses ${effect} effect for ${check.id}; pass ${EFFECT_FLAGS[effect]}`);
    }
  }
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    usage();
    return 0;
  }
  const requestedRoot = path.resolve(parsed.rootArg || process.cwd());
  if (!fs.statSync(requestedRoot).isDirectory()) throw new Error('repo root is not a directory');
  const root = fs.realpathSync(requestedRoot);
  const rootReal = root;
  console.log(`Validating harness before checks: ${root}`);
  if (!await invokeValidator(root)) throw new Error('harness validation failed; no checks were executed');
  const document = readChecks(root);
  const checks = Array.isArray(document.checks) ? document.checks : [];
  const selected = parsed.profile === 'quick' ? checks.filter((check) => check.quick === true) : checks.filter((check) => check.requiredByDefault === true);
  console.log(`Profile ${parsed.profile} selected ${selected.length} check(s).`);
  if (selected.length === 0) {
    console.error('No checks selected; verification is incomplete, so this is not a pass.');
    return 2;
  }
  for (const check of selected) {
    if (parsed.profile === 'full') assertEffectApproval(check, parsed.allowed);
    const cwd = path.resolve(root, check.cwd);
    ensureInside(rootReal, fs.realpathSync(cwd), `check ${check.id} cwd`);
  }
  const failed = [];
  for (const check of selected) {
    const cwd = fs.realpathSync(path.resolve(root, check.cwd));
    console.log(`Running ${check.id}: ${check.argv.map((part) => JSON.stringify(part)).join(' ')}`);
    const result = await runChild(check.argv, cwd, `check:${check.id}`, check.timeoutMs);
    try {
      console.log(`Receipt: ${writeReceipt(root, rootReal, result, check, parsed.profile)}`);
    } catch (error) {
      failed.push(`${check.id} receipt: ${error.message}`);
      continue;
    }
    if (result.timedOut || result.exitCode !== 0) failed.push(`${check.id} failed (exit ${result.exitCode ?? 'spawn error'})`);
  }
  if (failed.length > 0) {
    for (const failure of failed) console.error(`- ${failure}`);
    return 1;
  }
  console.log('All selected checks passed.');
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`Check runner failed: ${error.message}`);
  process.exitCode = 1;
}
