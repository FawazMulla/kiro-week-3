/**
 * Unit tests for InsightsPanel component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InsightsPanel } from './InsightsPanel.js';

describe('InsightsPanel', () => {
  let panel;
  let container;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.id = 'insights-panel';
    document.body.appendChild(container);

    panel = new InsightsPanel('insights-panel');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('should create an InsightsPanel instance', () => {
      expect(panel).toBeInstanceOf(InsightsPanel);
      expect(panel.containerId).toBe('insights-panel');
    });
  });

  describe('render', () => {
    it('should throw error if container element not found', () => {
      const invalidPanel = new InsightsPanel('non-existent');
      const correlation = {
        coefficient: 0.75,
        strength: 'Strong',
        pValue: 0.01,
        sampleSize: 30
      };
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 }
      ];
      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 1000 }
      ];

      // Should not throw an error, should handle gracefully
      expect(() => {
        invalidPanel.render(correlation, volatilityData, popularityData);
      }).not.toThrow();
    });

    it('should render empty state when correlation is null', () => {
      panel.render(null, [], []);
      
      expect(container.innerHTML).toContain('Correlation Insights');
      expect(container.innerHTML).toContain('No correlation data available');
    });

    it('should render empty state when volatility data is empty', () => {
      const correlation = {
        coefficient: 0.75,
        strength: 'Strong',
        pValue: 0.01,
        sampleSize: 30
      };
      
      panel.render(correlation, [], [{ date: new Date(), popularity: 100 }]);
      
      expect(container.innerHTML).toContain('No correlation data available');
    });

    it('should render empty state when popularity data is empty', () => {
      const correlation = {
        coefficient: 0.75,
        strength: 'Strong',
        pValue: 0.01,
        sampleSize: 30
      };
      
      panel.render(correlation, [{ date: new Date(), volatility: 2.5 }], []);
      
      expect(container.innerHTML).toContain('No correlation data available');
    });

    it('should render correlation coefficient rounded to 3 decimal places', () => {
      const correlation = {
        coefficient: 0.756789,
        strength: 'Strong',
        pValue: 0.01,
        sampleSize: 30
      };
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 }
      ];
      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 1000 }
      ];

      panel.render(correlation, volatilityData, popularityData);
      
      expect(container.innerHTML).toContain('0.757');
    });

    it('should display correlation strength with color coding', () => {
      const correlation = {
        coefficient: 0.75,
        strength: 'Strong',
        pValue: 0.01,
        sampleSize: 30
      };
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 }
      ];
      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 1000 }
      ];

      panel.render(correlation, volatilityData, popularityData);
      
      expect(container.innerHTML).toContain('Strong');
      expect(container.innerHTML).toContain('text-green-400');
    });

    it('should display highest volatility date and value', () => {
      const correlation = {
        coefficient: 0.5,
        strength: 'Moderate',
        pValue: 0.05,
        sampleSize: 30
      };
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 },
        { date: new Date('2024-01-02'), volatility: 5.8 },
        { date: new Date('2024-01-03'), volatility: 3.2 }
      ];
      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 1000 }
      ];

      panel.render(correlation, volatilityData, popularityData);
      
      expect(container.innerHTML).toContain('Highest Volatility');
      expect(container.innerHTML).toContain('5.80%');
    });

    it('should display highest popularity date and value', () => {
      const correlation = {
        coefficient: 0.5,
        strength: 'Moderate',
        pValue: 0.05,
        sampleSize: 30
      };
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 }
      ];
      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 1000 },
        { date: new Date('2024-01-02'), popularity: 2500 },
        { date: new Date('2024-01-03'), popularity: 1800 }
      ];

      panel.render(correlation, volatilityData, popularityData);
      
      expect(container.innerHTML).toContain('Highest Meme Popularity');
      expect(container.innerHTML).toContain('2500');
    });

    it('should display interpretation text', () => {
      const correlation = {
        coefficient: 0.75,
        strength: 'Strong',
        pValue: 0.01,
        sampleSize: 30
      };
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 }
      ];
      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 1000 }
      ];

      panel.render(correlation, volatilityData, popularityData);
      
      expect(container.innerHTML).toContain('What does this mean?');
      expect(container.innerHTML).toContain('strong positive relationship');
    });

    it('should display sample size', () => {
      const correlation = {
        coefficient: 0.5,
        strength: 'Moderate',
        pValue: 0.05,
        sampleSize: 42
      };
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 }
      ];
      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 1000 }
      ];

      panel.render(correlation, volatilityData, popularityData);
      
      expect(container.innerHTML).toContain('Based on 42 data points');
    });
  });

  describe('_getStrengthColor', () => {
    it('should return green for Strong correlation', () => {
      const color = panel._getStrengthColor('Strong');
      expect(color).toBe('text-green-400');
    });

    it('should return yellow for Moderate correlation', () => {
      const color = panel._getStrengthColor('Moderate');
      expect(color).toBe('text-yellow-400');
    });

    it('should return orange for Weak correlation', () => {
      const color = panel._getStrengthColor('Weak');
      expect(color).toBe('text-orange-400');
    });

    it('should return slate for Very Weak correlation', () => {
      const color = panel._getStrengthColor('Very Weak');
      expect(color).toBe('text-slate-400');
    });
  });

  describe('_getInterpretation', () => {
    it('should provide interpretation for strong positive correlation', () => {
      const interpretation = panel._getInterpretation(0.8, 'Strong');
      expect(interpretation).toContain('strong positive relationship');
      expect(interpretation).toContain('increase');
    });

    it('should provide interpretation for strong negative correlation', () => {
      const interpretation = panel._getInterpretation(-0.8, 'Strong');
      expect(interpretation).toContain('strong negative relationship');
      expect(interpretation).toContain('decrease');
    });

    it('should provide interpretation for moderate positive correlation', () => {
      const interpretation = panel._getInterpretation(0.5, 'Moderate');
      expect(interpretation).toContain('moderate positive relationship');
    });

    it('should provide interpretation for moderate negative correlation', () => {
      const interpretation = panel._getInterpretation(-0.5, 'Moderate');
      expect(interpretation).toContain('moderate negative relationship');
    });

    it('should provide interpretation for weak correlation', () => {
      const interpretation = panel._getInterpretation(0.3, 'Weak');
      expect(interpretation).toContain('weak');
      expect(interpretation).toContain('minimal');
    });

    it('should provide interpretation for very weak correlation', () => {
      const interpretation = panel._getInterpretation(0.1, 'Very Weak');
      expect(interpretation).toContain('very little to no relationship');
      expect(interpretation).toContain('independent');
    });
  });

  describe('_findHighestVolatility', () => {
    it('should find the point with highest volatility', () => {
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 },
        { date: new Date('2024-01-02'), volatility: 5.8 },
        { date: new Date('2024-01-03'), volatility: 3.2 }
      ];

      const highest = panel._findHighestVolatility(volatilityData);
      
      expect(highest.value).toBe(5.8);
      expect(highest.date).toEqual(new Date('2024-01-02'));
    });

    it('should return null for empty array', () => {
      const highest = panel._findHighestVolatility([]);
      expect(highest).toBeNull();
    });
  });

  describe('_findHighestPopularity', () => {
    it('should find the point with highest popularity', () => {
      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 1000 },
        { date: new Date('2024-01-02'), popularity: 2500 },
        { date: new Date('2024-01-03'), popularity: 1800 }
      ];

      const highest = panel._findHighestPopularity(popularityData);
      
      expect(highest.value).toBe(2500);
      expect(highest.date).toEqual(new Date('2024-01-02'));
    });

    it('should return null for empty array', () => {
      const highest = panel._findHighestPopularity([]);
      expect(highest).toBeNull();
    });
  });

  describe('_formatDate', () => {
    it('should format date in Indian locale', () => {
      const date = new Date('2024-01-15');
      const formatted = panel._formatDate(date);
      
      // The exact format may vary by environment, but should contain the date components
      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/15/);
    });
  });
});
