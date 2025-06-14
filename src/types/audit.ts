export interface AuditRule {
  id: string;
  version: number;
  rule_type: string;
  conditions: Record<string, any>;
  action: 'flag' | 'approve' | 'review' | 'reject';
  reason: string;
  original_instruction: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  confidence_score: number;
}

export interface RuleCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  logical_operator?: 'AND' | 'OR';
}

export interface ParsedRule {
  rule_type: string;
  conditions: RuleCondition[];
  action: string;
  reason: string;
  confidence_score: number;
}

export interface ConversionResult {
  success: boolean;
  rule?: ParsedRule;
  error?: string;
  suggestions?: string[];
}