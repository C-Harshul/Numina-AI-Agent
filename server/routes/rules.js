import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for demo purposes
// In production, you'd use a proper database
let rulesStorage = [];
let versionHistory = [];

// Get all rules
router.get('/', (req, res) => {
  try {
    const { active } = req.query;
    let rules = rulesStorage;
    
    if (active === 'true') {
      rules = rules.filter(rule => rule.is_active);
    }
    
    res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rules'
    });
  }
});

// Get rule by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const rule = rulesStorage.find(r => r.id === id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rule'
    });
  }
});

// Create new rule
router.post('/', (req, res) => {
  try {
    const { parsedRule, originalInstruction, createdBy = 'system' } = req.body;
    
    if (!parsedRule || !originalInstruction) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: parsedRule and originalInstruction'
      });
    }
    
    // Check if similar rule exists
    const existingRule = rulesStorage.find(rule => 
      rule.rule_type === parsedRule.rule_type && 
      rule.is_active &&
      JSON.stringify(rule.conditions) === JSON.stringify(parsedRule.conditions)
    );

    let newRule;

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

    rulesStorage.push(newRule);
    
    // Save version history
    versionHistory.push({
      rule_id: newRule.id,
      rule_type: newRule.rule_type,
      version: newRule.version,
      timestamp: newRule.created_at,
      created_by: newRule.created_by,
      action: 'created'
    });

    res.status(201).json({
      success: true,
      data: newRule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create rule'
    });
  }
});

// Update rule
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const ruleIndex = rulesStorage.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    rulesStorage[ruleIndex] = {
      ...rulesStorage[ruleIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: rulesStorage[ruleIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update rule'
    });
  }
});

// Delete rule
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = rulesStorage.length;
    
    rulesStorage = rulesStorage.filter(rule => rule.id !== id);
    
    if (rulesStorage.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete rule'
    });
  }
});

// Get rule versions
router.get('/versions/:ruleType', (req, res) => {
  try {
    const { ruleType } = req.params;
    const versions = rulesStorage
      .filter(rule => rule.rule_type === ruleType)
      .sort((a, b) => b.version - a.version);
    
    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rule versions'
    });
  }
});

// Rollback to version
router.post('/rollback/:ruleType/:version', (req, res) => {
  try {
    const { ruleType, version } = req.params;
    const targetRule = rulesStorage.find(rule => 
      rule.rule_type === ruleType && 
      rule.version === parseInt(version)
    );

    if (!targetRule) {
      return res.status(404).json({
        success: false,
        error: 'Rule version not found'
      });
    }

    // Deactivate current active rule
    rulesStorage.forEach(rule => {
      if (rule.rule_type === ruleType && rule.is_active) {
        rule.is_active = false;
      }
    });

    // Activate target rule
    targetRule.is_active = true;
    
    res.json({
      success: true,
      data: targetRule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to rollback rule'
    });
  }
});

// Export rules
router.get('/export/all', (req, res) => {
  try {
    res.json({
      success: true,
      data: rulesStorage,
      exported_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export rules'
    });
  }
});

// Import rules
router.post('/import', (req, res) => {
  try {
    const { rules } = req.body;
    
    if (!Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        error: 'Rules must be an array'
      });
    }
    
    // Validate structure
    const isValid = rules.every(rule => 
      rule.id && 
      rule.rule_type && 
      rule.conditions && 
      rule.action && 
      rule.version !== undefined
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rule structure'
      });
    }

    rulesStorage = rules;
    
    res.json({
      success: true,
      message: `Imported ${rules.length} rules successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to import rules'
    });
  }
});

// Clear all rules
router.delete('/clear/all', (req, res) => {
  try {
    rulesStorage = [];
    versionHistory = [];
    
    res.json({
      success: true,
      message: 'All rules cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear rules'
    });
  }
});

// Get rule statistics
router.get('/stats/overview', (req, res) => {
  try {
    const activeRules = rulesStorage.filter(rule => rule.is_active);

    const byType = {};
    const byAction = {};

    activeRules.forEach(rule => {
      byType[rule.rule_type] = (byType[rule.rule_type] || 0) + 1;
      byAction[rule.action] = (byAction[rule.action] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total: rulesStorage.length,
        active: activeRules.length,
        byType,
        byAction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rule statistics'
    });
  }
});

export default router;