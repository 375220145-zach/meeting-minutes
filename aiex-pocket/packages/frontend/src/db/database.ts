import Dexie, { type EntityTable } from 'dexie';

export interface TrainingMaterial {
  id?: number;
  fileName: string;
  fileType: 'txt' | 'pdf' | 'docx' | 'xlsx';
  rawContent: string;
  parsedAt: number;
  sizeBytes: number;
  tags: string[];
}

export interface RuleSet {
  id?: number;
  name: string;
  version: number;
  content: RuleSetContent;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface RuleSetContent {
  roleMapping: RoleMappingEntry[];
  phaseGates: PhaseGate[];
  customHeuristics: HeuristicRule[];
}

export interface RoleMappingEntry {
  rolePattern: string;
  department: string;
  defaultPriority: 'P0' | 'P1' | 'P2' | 'P3';
  weight: number;
}

export interface PhaseGate {
  phaseName: string;
  tolerancePercent: number;
  gateCriteria: string;
}

export interface HeuristicRule {
  name: string;
  triggerPattern: string;
  suggestedAction: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  riskLevel: 'high' | 'medium' | 'low';
}

export interface Meeting {
  id?: number;
  title: string;
  originalText: string;
  deidentifiedText: string;
  uploadedAt: number;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  wordCount: number;
  activeRuleSetId?: number;
  metadata: {
    sentimentScore?: number;
    actionCount?: number;
    trackUsed?: 'a' | 'b' | 'mixed';
    warnings?: string[];
  };
}

export interface Minute {
  id?: number;
  meetingId: number;
  actionItems: ActionItem[];
  rawAiResponse: string;
  generatedAt: number;
  exportHistory: ExportRecord[];
}

export interface ActionItem {
  id: string;
  action: string;
  owner: string;
  department: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  riskLevel: 'high' | 'medium' | 'low';
  deadlineHint: string;
  contextAnchor: string;
  contextStartIndex: number;
  ownerConfirmed: boolean;
  trackSource: 'heuristic' | 'ipd' | 'agile' | 'manual';
  userEdited: boolean;
  notes: string;
}

export interface ExportRecord {
  exportedAt: number;
  style: 'kpi-driven' | 'contextual-report';
  format: 'html-download' | 'clipboard';
}

class AiexDb extends Dexie {
  trainingMaterials!: EntityTable<TrainingMaterial, 'id'>;
  ruleSets!: EntityTable<RuleSet, 'id'>;
  meetings!: EntityTable<Meeting, 'id'>;
  minutes!: EntityTable<Minute, 'id'>;

  constructor() {
    super('AiexPocketDB');
    this.version(2).stores({
      trainingMaterials: '++id, fileType, parsedAt',
      ruleSets: '++id, isActive, updatedAt',
      meetings: '++id, status, uploadedAt, activeRuleSetId',
      minutes: '++id, meetingId, generatedAt',
    });
  }
}

export const db = new AiexDb();
