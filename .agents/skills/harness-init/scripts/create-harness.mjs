#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatesRoot = path.join(packageRoot, 'templates');
const CORE = [
  ['AGENTS.md', 'AGENTS.md.tmpl', 'agents'],
  ['harness/manifest.json', 'manifest.json', 'raw'],
  ['harness/checks.json', 'checks.json', 'raw'],
  ['harness/progress.md', 'progress.md', 'raw'],
  ['harness/schemas/manifest.schema.json', 'schemas/manifest.schema.json', 'raw'],
  ['harness/schemas/checks.schema.json', 'schemas/checks.schema.json', 'raw'],
  ['harness/schemas/work.schema.json', 'schemas/work.schema.json', 'raw'],
  ['harness/scripts/validate.mjs', 'harness/scripts/validate.mjs', 'raw'],
  ['harness/scripts/run-checks.mjs', 'harness/scripts/run-checks.mjs', 'raw']
];

function usage() {
  console.log(`Usage: node scripts/create-harness.mjs <existing-target-dir> [options]

Required metadata:
  --repo-name <name> --purpose <text> --verification-command <command>

Options:
  --dry-run
  --with-init --start-argv '<json array>' --smoke-argv '<json array>'
  --readiness-url <http(s) URL>`);
}

function parseArgs(args) {
  const options = {dryRun: false, withInit: false};
  const valueOptions = new Map([
    ['--target', 'target'],
    ['--repo-name', 'repoName'],
    ['--name', 'repoName'],
    ['--purpose', 'purpose'],
    ['--repo-purpose', 'purpose'],
    ['--verification-command', 'verificationCommand'],
    ['--verify-command', 'verificationCommand'],
    ['--start-argv', 'startArgv'],
    ['--smoke-argv', 'smokeArgv'],
    ['--readiness-url', 'readinessUrl']
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help') return {help: true};
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--with-init') options.withInit = true;
    else if (valueOptions.has(arg)) {
      const key = valueOptions.get(arg);
      if (options[key] !== undefined) throw new Error(`duplicate option ${arg}`);
      const value = args[++index];
      if (value === undefined || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      options[key] = value;
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown option ${arg}`);
    } else if (options.target === undefined) {
      options.target = arg;
    } else {
      throw new Error(`unexpected argument ${arg}`);
    }
  }
  return options;
}

function nonEmpty(value, label) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('\0')) throw new Error(`${label} must be a non-empty string`);
  if (value.includes('{{') || value.includes('}}')) throw new Error(`${label} cannot contain template markers`);
  return value.trim();
}

function parseArgvJson(value, label) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} must be valid JSON array (${error.message})`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((part) => typeof part !== 'string' || part.trim() === '' || part.includes('\0'))) {
    throw new Error(`${label} must be a non-empty JSON array of non-empty strings`);
  }
  return parsed;
}

function validateConfig(options) {
  if (options.target === undefined) throw new Error('an existing target directory is required');
  if (typeof options.target !== 'string' || options.target.trim() === '' || options.target.includes('\0')) throw new Error('target must be a non-empty path');
  options.repoName = nonEmpty(options.repoName, '--repo-name');
  options.purpose = nonEmpty(options.purpose, '--purpose');
  options.verificationCommand = nonEmpty(options.verificationCommand, '--verification-command');
  if (options.readinessUrl !== undefined && !options.withInit) throw new Error('--readiness-url requires --with-init');
  if (!options.withInit && (options.startArgv !== undefined || options.smokeArgv !== undefined)) throw new Error('--start-argv and --smoke-argv require --with-init');
  if (options.withInit) {
    if (options.startArgv === undefined || options.smokeArgv === undefined) throw new Error('--with-init requires --start-argv and --smoke-argv JSON arrays');
    options.startArgv = parseArgvJson(options.startArgv, '--start-argv');
    options.smokeArgv = parseArgvJson(options.smokeArgv, '--smoke-argv');
    if (options.readinessUrl !== undefined) {
      try {
        const url = new URL(options.readinessUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('only http(s) is allowed');
        options.readinessUrl = url.toString();
      } catch (error) {
        throw new Error(`--readiness-url must be a valid http(s) URL (${error.message})`);
      }
    }
  }
}

function readJsonIfFile(file) {
  try {
    if (!fs.statSync(file).isFile()) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function isCanonicalManifest(document) {
  if (document === null || typeof document !== 'object' || Array.isArray(document)) return false;
  if (Object.keys(document).sort().join(',') !== ['features', 'mode', 'schemaVersion'].join(',')) return false;
  if (document.schemaVersion !== 1 || !['sequential', 'parallel'].includes(document.mode) || !Array.isArray(document.features)) return false;
  const featureKeys = ['dependsOn', 'id', 'order', 'owners', 'spec', 'status'].join(',');
  return document.features.every((feature) => feature !== null && typeof feature === 'object' && !Array.isArray(feature) && Object.keys(feature).sort().join(',') === featureKeys);
}

function detectLayout(target) {
  const harness = path.join(target, 'harness');
  let rootHarness = 'absent';
  try {
    const stat = fs.lstatSync(harness);
    rootHarness = stat.isDirectory() ? 'directory' : 'other';
  } catch {
    // absent
  }
  if (rootHarness === 'directory') {
    const manifest = readJsonIfFile(path.join(harness, 'manifest.json'));
    const validCanonical = isCanonicalManifest(manifest);
    if (!validCanonical) throw new Error('existing root harness is malformed or unrecognized; expected harness/manifest.json with schemaVersion 1 and features array');
  } else if (rootHarness === 'other') {
    throw new Error('existing root harness path is not a directory; refusing to overwrite it');
  }
  return {validCanonical: rootHarness === 'directory'};
}

function render(template, options) {
  return template
    .replaceAll('{{REPO_NAME}}', options.repoName)
    .replaceAll('{{PURPOSE}}', options.purpose)
    .replaceAll('{{VERIFICATION_COMMAND}}', options.verificationCommand);
}

function renderInit(template, options) {
  const output = template
    .replace('__START_ARGV_JSON__', JSON.stringify(options.startArgv))
    .replace('__SMOKE_ARGV_JSON__', JSON.stringify(options.smokeArgv))
    .replace('__READINESS_URL_JSON__', JSON.stringify(options.readinessUrl ?? null));
  if (/__[A-Z0-9_]+__/.test(output)) throw new Error('internal error: rendered init contains unresolved placeholders');
  return output;
}

function sourceContent(relative, kind, options) {
  const template = fs.readFileSync(path.join(templatesRoot, relative), 'utf8');
  if (kind === 'agents') return render(template, options);
  if (relative === 'init.mjs.tmpl') return renderInit(template, options);
  return template;
}

function checkParentSafety(target, relative, dryRun) {
  const parts = path.dirname(relative).split(path.sep).filter(Boolean);
  let current = target;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error(`${path.relative(target, current)} is a symlink`);
      if (!stat.isDirectory()) throw new Error(`${path.relative(target, current)} is not a directory`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!dryRun) fs.mkdirSync(current);
    }
  }
}

function planFiles(target, options) {
  const files = [...CORE];
  if (options.withInit) files.push(['init.mjs', 'init.mjs.tmpl', 'init']);
  return files.map(([destinationRelative, sourceRelative, kind]) => ({
    destinationRelative,
    sourceRelative,
    kind,
    destination: path.join(target, destinationRelative)
  }));
}

function execute(target, options, files) {
  let writes = 0;
  for (const file of files) {
    let exists = false;
    try {
      const stat = fs.lstatSync(file.destination);
      exists = true;
      if (stat.isDirectory()) throw new Error(`${file.destinationRelative} exists as a directory; refusing to replace it`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (exists) {
      console.log(`SKIP existing ${file.destinationRelative}`);
      continue;
    }
    checkParentSafety(target, file.destinationRelative, options.dryRun);
    if (options.dryRun) {
      console.log(`CREATE ${file.destinationRelative} (dry-run)`);
      writes += 1;
      continue;
    }
    const content = sourceContent(file.sourceRelative, file.kind, options);
    fs.writeFileSync(file.destination, content, {flag: 'wx'});
    console.log(`CREATE ${file.destinationRelative}`);
    writes += 1;
  }
  return writes;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return 0;
  }
  validateConfig(options);
  const target = path.resolve(options.target);
  let stat;
  try {
    stat = fs.statSync(target);
  } catch (error) {
    throw new Error(`target directory must already exist (${error.message})`);
  }
  if (!stat.isDirectory()) throw new Error('target must be an existing directory');
  const layout = detectLayout(target);
  const files = planFiles(target, options);
  const writes = execute(target, options, files);
  console.log(`${options.dryRun ? 'Dry-run' : 'Real-run'} complete: ${writes} create action(s), ${files.length - writes} skip action(s).`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`create-harness refused: ${error.message}`);
  process.exitCode = 1;
}
