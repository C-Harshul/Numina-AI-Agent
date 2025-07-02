import { AuditRule, ParsedRule } from '../types/audit';
import { apiClient } from './apiClient';

export class RuleStorage {
  static async saveRule(parsedRule: ParsedRule, originalInstruction: string, createdBy: string = 'user'): Promise<AuditRule> {
    try {
      const response = await apiClient.createRule(parsedRule, originalInstruction, createdBy);
      return response.data;
    } catch (error) {
      console.error('Failed to save rule:', error);
      throw error;
    }
  }

  static async getAllRules(): Promise<AuditRule[]> {
    try {
      const response = await apiClient.getRules(false);
      return response.data;
    } catch (error) {
      console.error('Failed to get all rules:', error);
      return [];
    }
  }

  static async getActiveRules(): Promise<AuditRule[]> {
    try {
      const response = await apiClient.getRules(true);
      return response.data;
    } catch (error) {
      console.error('Failed to get active rules:', error);
      return [];
    }
  }

  static async getRuleById(id: string): Promise<AuditRule | null> {
    try {
      const response = await apiClient.getRule(id);
      return response.data;
    } catch (error) {
      console.error('Failed to get rule by ID:', error);
      return null;
    }
  }

  static async getRuleVersions(ruleType: string): Promise<AuditRule[]> {
    try {
      const response = await apiClient.getRuleVersions(ruleType);
      return response.data;
    } catch (error) {
      console.error('Failed to get rule versions:', error);
      return [];
    }
  }

  static async deactivateRule(id: string): Promise<boolean> {
    try {
      await apiClient.updateRule(id, { is_active: false });
      return true;
    } catch (error) {
      console.error('Failed to deactivate rule:', error);
      return false;
    }
  }

  static async rollbackToVersion(ruleType: string, version: number): Promise<AuditRule | null> {
    try {
      const response = await apiClient.rollbackRule(ruleType, version);
      return response.data;
    } catch (error) {
      console.error('Failed to rollback rule:', error);
      return null;
    }
  }

  static async deleteRule(id: string): Promise<boolean> {
    try {
      await apiClient.deleteRule(id);
      return true;
    } catch (error) {
      console.error('Failed to delete rule:', error);
      return false;
    }
  }

  static async exportRules(): Promise<string> {
    try {
      const response = await apiClient.exportRules();
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error('Failed to export rules:', error);
      throw error;
    }
  }

  static async importRules(rulesJson: string): Promise<boolean> {
    try {
      const rules = JSON.parse(rulesJson);
      await apiClient.importRules(rules);
      return true;
    } catch (error) {
      console.error('Failed to import rules:', error);
      return false;
    }
  }

  static async clearAllRules(): Promise<void> {
    try {
      await apiClient.clearAllRules();
    } catch (error) {
      console.error('Failed to clear all rules:', error);
      throw error;
    }
  }

  static async getRuleStats(): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
    byAction: Record<string, number>;
  }> {
    try {
      const response = await apiClient.getRuleStats();
      return response.data;
    } catch (error) {
      console.error('Failed to get rule stats:', error);
      return {
        total: 0,
        active: 0,
        byType: {},
        byAction: {}
      };
    }
  }
}