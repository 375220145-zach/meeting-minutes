import fs from 'fs';
import path from 'path';
import { config } from '../config';

const CONFIG_FILE = path.join(__dirname, '..', '..', '.aiex-config.json');

interface LocalConfig {
  apiKey?: string;
}

function readLocalConfig(): LocalConfig {
  if (config.isCloud) return {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function writeLocalConfig(data: LocalConfig): void {
  if (config.isCloud) return; // No file writes on cloud
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getEffectiveApiKey(): string {
  const local = readLocalConfig();
  if (local.apiKey) return local.apiKey;
  return config.deepseek.apiKey;
}

export function setApiKey(key: string): void {
  writeLocalConfig({ apiKey: key });
  config.deepseek.apiKey = key;
}

export function hasApiKey(): boolean {
  const key = getEffectiveApiKey();
  return !!key && !key.includes('your-');
}
