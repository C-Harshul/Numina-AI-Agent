import { AuditRule, ParsedRule } from '../types/audit';
import { v4 as uuidv4 } from 'uuid';

export class RuleStorage {
  private static readonly STORAGE_KEY = 'numina_audit_rules';
  private static readonly VERSION_KEY = 'numina_rule_versions';

  static saveRule(parsedRule: ParsedRule, originalInstruction: string, createdBy: string = 'system'): AuditRule {
    const existingRules = this.getAllRules();
    
    // Check if similar rule exists
    const existingRule = existingRules.find(rule => 
      rule.rule_type === parsedRule.rule_type && 
      rule.is_active &&
      JSON.stringify(rule.conditions) === JSON.stringify(parsedRule.conditions)
    );

    let newRule: AuditRule;

    if (existingRule) {
      // Create new version
      newRule = {
        ...existingRule,
        id: uuidv4(),
        version: existingRule.version + 1,
        original_instruction: originalInstruction,
        created_at: new Date().toISOString(),
        created_by: createdBy,
        confidence_score: parsedRule.confidence_score
      };
      
      // Deactivate old version
      existingRule.is_active = false;
    } else {
      // Create new rule
      newRule = {
        id: uuidv4(),
        version: 1,
        rule_type: parsedRule.rule_type,
        conditions: parsedRule.conditions,
        action: parsedRule.action,
        reason: parsedRule.reason,
        original_instruction: originalInstruction,
        created_at: new Date().toISOString(),
        created_by: createdBy,
        is_active: true,
        confidence_score: parsedRule.confidence_score
      };
    }

    // Save to storage
    const updatedRules = existingRule 
      ? existingRules.map(rule => rule.id === existingRule.id ? existingRule : rule).concat(newRule)
      : [...existingRules, newRule];

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedRules));
    
    // Save version history
    this.saveVersionHistory(newRule);

    return newRule;
  }

  static getAllRules(): AuditRule[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getActiveRules(): AuditRule[] {
    return this.getAllRules().filter(rule => rule.is_active);
  }

  static getRuleById(id: string): AuditRule | null {
    const rules = this.getAllRules();
    return rules.find(rule => rule.id === id) || null;
  }

  static getRuleVersions(ruleType: string): AuditRule[] {
    return this.getAllRules()
      .filter(rule => rule.rule_type === ruleType)
      .sort((a, b) => b.version - a.version);
  }

  static deactivateRule(id: string): boolean {
    const rules = this.getAllRules();
    const ruleIndex = rules.findIndex(rule => rule.id === id);
    
    if (ruleIndex === -1) return false;
    
    rules[ruleIndex].is_active = false;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rules));
    return true;
  }

  static rollbackToVersion(ruleType: string, version: number): AuditRule | null {
    const rules = this.getAllRules();
    const targetRule = rules.find(rule => 
      rule.rule_type === ruleType && 
      rule.version === version
    );

    if (!targetRule) return null;

    // Deactivate current active rule
    rules.forEach(rule => {
      if (rule.rule_type === ruleType && rule.is_active) {
        rule.is_active = false;
      }
    });

    // Activate target rule
    targetRule.is_active = true;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rules));
    return targetRule;
  }

  static deleteRule(id: string): boolean {
    const rules = this.getAllRules();
    const filteredRules = rules.filter(rule => rule.id !== id);
    
    if (filteredRules.length === rules.length) return false;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredRules));
    return true;
  }

  static exportRules(): string {
    return JSON.stringify(this.getAllRules(), null, 2);
  }

  static importRules(rulesJson: string): boolean {
    try {
      const rules = JSON.parse(rulesJson) as AuditRule[];
      
      // Validate structure
      if (!Array.isArray(rules)) return false;
      
      const isValid = rules.every(rule => 
        rule.id && 
        rule.rule_type && 
        rule.conditions && 
        rule.action && 
        rule.version !== undefined
      );

      if (!isValid) return false;

      localStorage.setItem(this.STORAGE_KEY, rulesJson);
      return true;
    } catch {
      return false;
    }
  }

  private static saveVersionHistory(rule: AuditRule): void {
    const versionHistory = this.getVersionHistory();
    const entry = {
      rule_id: rule.id,
      rule_type: rule.rule_type,
      version: rule.version,
      timestamp: rule.created_at,
      created_by: rule.created_by,
      action: 'created'
    };

    versionHistory.push(entry);
    localStorage.setItem(this.VERSION_KEY, JSON.stringify(versionHistory));
  }

  private static getVersionHistory(): any[] {
    const stored = localStorage.getItem(this.VERSION_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static clearAllRules(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VERSION_KEY);
  }

  static getRuleStats(): {
    total: number;
    active: number;
    byType: Record<string, number>;
    byAction: Record<string, number>;
  } {
    const rules = this.getAllRules();
    const activeRules = rules.filter(rule => rule.is_active);

    const byType: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    activeRules.forEach(rule => {
      byType[rule.rule_type] = (byType[rule.rule_type] || 0) + 1;
      byAction[rule.action] = (byAction[rule.action] || 0) + 1;
    });

    return {
      total: rules.length,
      active: activeRules.length,
      byType,
      byAction
    };
  }
}