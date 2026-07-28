#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACCEPTANCE_ID_RE = /^[a-z][a-z0-9-]*$/;
const STATUS_SET = new Set(['proposed', 'planned', 'active', 'blocked', 'completed', 'cancelled', 'superseded']);
const TERMINAL = new Set(['completed', 'cancelled', 'superseded']);
const FEATURE_KEYS = ['id', 'order', 'status', 'owners', 'dependsOn', 'spec'];
const WORK_KEYS = ['schemaVersion', 'id', 'acceptanceResults', 'nextAction', 'completion'];
const RESULT_KEYS = ['id', 'met', 'evidence'];
const COMPLETION_KEYS = ['verifiedAt', 'completedAt', 'cancellationSummary', 'supersededBy'];
const CHECK_KEYS = ['id', 'argv', 'cwd', 'quick', 'requiredByDefault', 'timeoutMs', 'declaredEffects'];
const EFFECT_KEYS = ['network', 'writes', 'services', 'installs', 'secrets'];

const errors = [];
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const report = (where, message) => errors.push(`${where}: ${message}`);

function exactKeys(value, allowed, where) {
  if (!isObject(value)) {
    report(where, 'must be a JSON object');
    return;
  }
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) report(where, `unknown key "${key}"; allowed: ${allowed.join(', ')}`);
  }
}

function required(value, key, where) {
  if (isObject(value) && !Object.prototype.hasOwnProperty.call(value, key)) report(where, `missing required key "${key}"`);
}

function checkSchemaVersion(value, where) {
  if (typeof value !== 'number' || value !== 1) report(where, 'schemaVersion must be number 1');
}

function readJson(root, relative) {
  const full = path.join(root, relative);
  try {
    const stat = fs.statSync(full);
    if (!stat.isFile()) throw new Error('not a regular file');
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (error) {
    report(relative, `cannot read valid JSON (${error.message})`);
    return null;
  }
}

function validUtc(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function parseSpec(root, feature) {
  const relative = `docs/specs/${feature.id}.md`;
  const full = path.join(root, relative);
  let content;
  try {
    if (!fs.statSync(full).isFile()) throw new Error('not a regular file');
    content = fs.readFileSync(full, 'utf8');
  } catch (error) {
    report(`feature ${feature.id}`, `spec ${relative} is missing or unreadable (${error.message})`);
    return [];
  }
  const title = content.match(/^#\s+Feature:\s+([^\n]+?)\s*$/m);
  if (!title || title[1].trim() !== feature.id) report(relative, `must contain the identity heading "# Feature: ${feature.id}"`);
  const ids = [];
  for (const [lineNumber, line] of content.split(/\r?\n/).entries()) {
    const match = line.match(/^\s*-\s+\[([^\]]+)\]\s+(.+?)\s*$/);
    if (!match) continue;
    const id = match[1];
    if (!ACCEPTANCE_ID_RE.test(id)) report(`${relative}:${lineNumber + 1}`, `invalid acceptance ID "${id}"`);
    if (ids.includes(id)) report(`${relative}:${lineNumber + 1}`, `duplicate acceptance ID "${id}"`);
    ids.push(id);
  }
  if (ids.length === 0) report(relative, 'must contain acceptance lines such as - [a1] observable condition');
  return ids;
}

function validateCompletion(work, feature, acceptanceIds, relative, knownIds) {
  const completion = work.completion;
  if (completion !== null && !isObject(completion)) report(relative, 'completion must be null or an object');
  if (isObject(completion)) {
    exactKeys(completion, COMPLETION_KEYS, `${relative}.completion`);
    for (const key of Object.keys(completion)) {
      if (completion[key] !== null && typeof completion[key] !== 'string') report(`${relative}.completion.${key}`, 'must be string or null');
    }
  }
  const results = Array.isArray(work.acceptanceResults) ? work.acceptanceResults : [];
  const allMet = results.length === acceptanceIds.length && results.every((result) => isObject(result) && result.met === true && nonEmptyString(result.evidence));
  if (feature.status === 'active' || feature.status === 'blocked') {
    if (!nonEmptyString(work.nextAction)) report(relative, `${feature.status} requires a non-empty nextAction`);
  }
  if (feature.status === 'completed') {
    if (work.nextAction !== null) report(relative, 'completed requires nextAction: null');
    if (!isObject(completion)) report(relative, 'completed requires a completion object');
    if (!isObject(completion) || !validUtc(completion.verifiedAt) || !validUtc(completion.completedAt)) report(relative, 'completed requires verifiedAt and completedAt ISO UTC strings');
    if (!allMet) report(relative, 'completed requires every acceptance to be met with non-empty evidence');
  } else if (feature.status === 'cancelled') {
    if (work.nextAction !== null) report(relative, 'cancelled requires nextAction: null');
    if (!isObject(completion) || !nonEmptyString(completion.cancellationSummary)) report(relative, 'cancelled requires non-empty cancellationSummary');
  } else if (feature.status === 'superseded') {
    if (work.nextAction !== null) report(relative, 'superseded requires nextAction: null');
    if (!isObject(completion) || typeof completion.supersededBy !== 'string' || !ID_RE.test(completion.supersededBy)) report(relative, 'superseded requires a valid supersededBy ID');
    if (isObject(completion) && completion.supersededBy === feature.id) report(relative, 'supersededBy cannot reference itself');
    if (isObject(completion) && typeof completion.supersededBy === 'string' && !knownIds.has(completion.supersededBy)) report(relative, `supersededBy ${completion.supersededBy} does not exist`);
  } else if (completion !== null) {
    report(relative, `${feature.status} requires completion: null`);
  }
}

function validateWork(root, feature, acceptanceIds, knownIds) {
  const relative = `harness/work/${feature.id}.json`;
  const work = readJson(root, relative);
  if (!work) return;
  exactKeys(work, WORK_KEYS, relative);
  if (!isObject(work)) return;
  for (const key of WORK_KEYS) required(work, key, relative);
  checkSchemaVersion(work.schemaVersion, `${relative}.schemaVersion`);
  if (work.id !== feature.id) report(relative, `id must match manifest feature ${feature.id}`);
  if (!Array.isArray(work.acceptanceResults)) {
    report(relative, 'acceptanceResults must be an array');
  } else {
    const actualIds = [];
    work.acceptanceResults.forEach((result, index) => {
      const resultWhere = `${relative}.acceptanceResults[${index}]`;
      exactKeys(result, RESULT_KEYS, resultWhere);
      if (!isObject(result)) return;
      for (const key of RESULT_KEYS) required(result, key, resultWhere);
      if (typeof result.id !== 'string' || !ACCEPTANCE_ID_RE.test(result.id)) report(resultWhere, 'id must be a stable lowercase acceptance ID');
      if (actualIds.includes(result.id)) report(resultWhere, `duplicate acceptance ID "${result.id}"`);
      actualIds.push(result.id);
      if (typeof result.met !== 'boolean') report(resultWhere, 'met must be boolean');
      if (result.evidence !== null && typeof result.evidence !== 'string') report(resultWhere, 'evidence must be string or null');
      if (result.met && !nonEmptyString(result.evidence)) report(resultWhere, 'met: true requires non-empty evidence');
    });
    if (JSON.stringify(actualIds) !== JSON.stringify(acceptanceIds)) report(relative, `acceptance IDs must match spec sequence: expected [${acceptanceIds.join(', ')}], got [${actualIds.join(', ')}]`);
  }
  if (work.nextAction !== null && typeof work.nextAction !== 'string') report(relative, 'nextAction must be string or null');
  validateCompletion(work, feature, acceptanceIds, relative, knownIds);
}

function validateCwd(root, candidate, where) {
  if (typeof candidate !== 'string' || candidate.length === 0 || path.isAbsolute(candidate)) {
    report(where, 'cwd must be a non-empty relative path');
    return;
  }
  if (candidate.split(/[\\/]+/).includes('..')) report(where, 'cwd cannot contain ..');
  const rootReal = fs.realpathSync(root);
  const full = path.resolve(root, candidate);
  let fullReal;
  try {
    fullReal = fs.realpathSync(full);
  } catch (error) {
    report(where, `cwd does not exist (${error.message})`);
    return;
  }
  const relative = path.relative(rootReal, fullReal);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) report(where, 'cwd resolves outside repository root');
  if (!fs.statSync(fullReal).isDirectory()) report(where, 'cwd must resolve to a directory');
}

function validateChecks(root, document) {
  const where = 'harness/checks.json';
  if (!document) return;
  exactKeys(document, ['schemaVersion', 'checks'], where);
  if (!isObject(document)) return;
  for (const key of ['schemaVersion', 'checks']) required(document, key, where);
  checkSchemaVersion(document.schemaVersion, `${where}.schemaVersion`);
  if (!Array.isArray(document.checks)) {
    report(where, 'checks must be an array');
    return;
  }
  const ids = new Set();
  document.checks.forEach((check, index) => {
    const checkWhere = `${where}.checks[${index}]`;
    exactKeys(check, CHECK_KEYS, checkWhere);
    if (!isObject(check)) return;
    for (const key of CHECK_KEYS) required(check, key, checkWhere);
    if (typeof check.id !== 'string' || !ID_RE.test(check.id)) report(checkWhere, 'id must be lowercase kebab-case');
    if (ids.has(check.id)) report(checkWhere, `duplicate check id "${check.id}"`);
    ids.add(check.id);
    if (!Array.isArray(check.argv) || check.argv.length === 0 || check.argv.some((part) => typeof part !== 'string' || part.trim() === '')) report(checkWhere, 'argv must be a non-empty array of non-empty strings');
    if (typeof check.quick !== 'boolean') report(checkWhere, 'quick must be boolean');
    if (typeof check.requiredByDefault !== 'boolean') report(checkWhere, 'requiredByDefault must be boolean');
    if (!Number.isInteger(check.timeoutMs) || check.timeoutMs < 1 || check.timeoutMs > 600000) report(checkWhere, 'timeoutMs must be an integer from 1 to 600000');
    validateCwd(root, check.cwd, `${checkWhere}.cwd`);
    exactKeys(check.declaredEffects, EFFECT_KEYS, `${checkWhere}.declaredEffects`);
    if (!isObject(check.declaredEffects)) return;
    for (const key of EFFECT_KEYS) {
      required(check.declaredEffects, key, `${checkWhere}.declaredEffects`);
      if (typeof check.declaredEffects[key] !== 'boolean') report(`${checkWhere}.declaredEffects.${key}`, 'must be boolean');
    }
    const safe = EFFECT_KEYS.every((key) => check.declaredEffects[key] === false);
    if (check.quick === true && !safe) report(checkWhere, 'quick: true is allowed only when every declared effect is false');
  });
}

function validateManifest(root, document) {
  const where = 'harness/manifest.json';
  if (!document) return [];
  exactKeys(document, ['schemaVersion', 'mode', 'features'], where);
  if (!isObject(document)) return [];
  for (const key of ['schemaVersion', 'mode', 'features']) required(document, key, where);
  checkSchemaVersion(document.schemaVersion, `${where}.schemaVersion`);
  if (!['sequential', 'parallel'].includes(document.mode)) report(where, 'mode must be sequential or parallel');
  if (!Array.isArray(document.features)) {
    report(where, 'features must be an array');
    return [];
  }
  const features = [];
  const ids = new Set();
  const orders = new Set();
  let previousOrder = 0;
  document.features.forEach((rawFeature, index) => {
    const featureWhere = `${where}.features[${index}]`;
    exactKeys(rawFeature, FEATURE_KEYS, featureWhere);
    if (!isObject(rawFeature)) return;
    const feature = {...rawFeature, index};
    features.push(feature);
    for (const key of FEATURE_KEYS) required(rawFeature, key, featureWhere);
    if (typeof feature.id !== 'string' || !ID_RE.test(feature.id)) report(featureWhere, 'id must be lowercase kebab-case');
    if (ids.has(feature.id)) report(featureWhere, `duplicate feature id "${feature.id}"`);
    ids.add(feature.id);
    if (!Number.isInteger(feature.order) || feature.order < 1) report(featureWhere, 'order must be a positive integer');
    if (orders.has(feature.order)) report(featureWhere, `duplicate order ${feature.order}`);
    if (Number.isInteger(feature.order) && feature.order <= previousOrder) report(featureWhere, 'order must be strictly increasing in manifest array order');
    if (Number.isInteger(feature.order)) previousOrder = feature.order;
    orders.add(feature.order);
    if (!Array.isArray(feature.owners) || feature.owners.length === 0 || feature.owners.some((owner) => !nonEmptyString(owner))) report(featureWhere, 'owners must be a non-empty array of non-empty strings');
    if (Array.isArray(feature.owners) && new Set(feature.owners).size !== feature.owners.length) report(featureWhere, 'owners must be unique');
    if (!Array.isArray(feature.dependsOn) || feature.dependsOn.some((id) => typeof id !== 'string' || !ID_RE.test(id))) report(featureWhere, 'dependsOn must be an array of lowercase kebab IDs');
    if (Array.isArray(feature.dependsOn) && new Set(feature.dependsOn).size !== feature.dependsOn.length) report(featureWhere, 'dependsOn must be unique');
    const expectedSpec = `docs/specs/${feature.id}.md`;
    if (feature.spec !== expectedSpec) report(featureWhere, `spec must be exactly ${expectedSpec}`);
  });
  const byId = new Map(features.map((feature) => [feature.id, feature]));
  for (const feature of features) {
    const featureWhere = `feature ${feature.id}`;
    for (const prerequisite of Array.isArray(feature.dependsOn) ? feature.dependsOn : []) {
      if (!ids.has(prerequisite)) report(featureWhere, `dependsOn ID ${prerequisite} does not exist`);
      if (prerequisite === feature.id) report(featureWhere, 'dependsOn cannot reference itself');
    }
    const acceptanceIds = parseSpec(root, feature);
    validateWork(root, feature, acceptanceIds, ids);
    if (['active', 'blocked', 'completed'].includes(feature.status)) {
      for (const prerequisite of Array.isArray(feature.dependsOn) ? feature.dependsOn : []) {
        const prerequisiteFeature = byId.get(prerequisite);
        if (prerequisiteFeature && prerequisiteFeature.status !== 'completed') report(featureWhere, `hard prerequisite ${prerequisite} must be completed before status ${feature.status}`);
      }
    }
    if (typeof feature.status !== 'string' || !STATUS_SET.has(feature.status)) report(featureWhere, `status must be one of ${[...STATUS_SET].join(', ')}`);
  }
  if (document.mode === 'sequential') {
    const activeOrBlocked = features.filter((feature) => feature.status === 'active' || feature.status === 'blocked');
    if (activeOrBlocked.length > 1) report(where, 'sequential mode permits at most one active or blocked feature');
    for (const feature of activeOrBlocked) {
      for (const earlier of features) {
        if (earlier.order < feature.order && !TERMINAL.has(earlier.status)) report(`feature ${feature.id}`, `sequential feature is not eligible while earlier feature ${earlier.id} is ${earlier.status}`);
      }
    }
  }
  return features;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node harness/scripts/validate.mjs [repo-root]');
    return 0;
  }
  if (args.length > 1) {
    console.error('Usage: node harness/scripts/validate.mjs [repo-root]');
    return 2;
  }
  const root = path.resolve(args[0] || process.cwd());
  try {
    if (!fs.statSync(root).isDirectory()) throw new Error('repo root is not a directory');
    fs.realpathSync(root);
  } catch (error) {
    console.error(`Validation failed: ${root}: ${error.message}`);
    return 1;
  }
  const manifest = readJson(root, 'harness/manifest.json');
  const checks = readJson(root, 'harness/checks.json');
  validateManifest(root, manifest);
  validateChecks(root, checks);
  if (errors.length > 0) {
    console.error(`Harness validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    return 1;
  }
  console.log('Harness validation passed: manifest, specs/work, lifecycle, prerequisites, and checks are valid.');
  return 0;
}

process.exitCode = main();
