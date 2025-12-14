/**
 * Correlation - Utility for calculating correlation between volatility and popularity data
 * Implements Pearson correlation coefficient and data alignment
 */

/**
 * Align volatility and popularity data by matching dates
 * @param {VolatilityPoint[]} volatilityData - Array of volatility points
 * @param {PopularityPoint[]} popularityData - Array of popularity points
 * @returns {{volatility: number[], popularity: number[], dates: Date[]}} Aligned data arrays
 */
export function alignDataByDate(volatilityData, popularityData) {
  // Handle edge cases
  if (!volatilityData || !popularityData || volatilityData.length === 0 || popularityData.length === 0) {
    return { volatility: [], popularity: [], dates: [] };
  }

  // Create maps for quick lookup by date string
  const volatilityMap = new Map();
  for (const point of volatilityData) {
    const dateStr = point.date.toISOString().split('T')[0];
    volatilityMap.set(dateStr, point.volatility);
  }

  const popularityMap = new Map();
  for (const point of popularityData) {
    const dateStr = point.date.toISOString().split('T')[0];
    popularityMap.set(dateStr, point.popularity);
  }

  // Find common dates
  const alignedVolatility = [];
  const alignedPopularity = [];
  const alignedDates = [];

  for (const [dateStr, volatility] of volatilityMap.entries()) {
    if (popularityMap.has(dateStr)) {
      alignedVolatility.push(volatility);
      alignedPopularity.push(popularityMap.get(dateStr));
      alignedDates.push(new Date(dateStr));
    }
  }

  return {
    volatility: alignedVolatility,
    popularity: alignedPopularity,
    dates: alignedDates
  };
}

/**
 * Calculate Pearson correlation coefficient between two datasets
 * @param {number[]} x - First dataset
 * @param {number[]} y - Second dataset
 * @returns {number} Correlation coefficient between -1 and 1
 */
export function calculatePearsonCorrelation(x, y) {
  // Handle edge cases
  if (!x || !y || x.length === 0 || y.length === 0) {
    return 0;
  }

  if (x.length !== y.length) {
    throw new Error('Arrays must have the same length for correlation calculation');
  }

  if (x.length === 1) {
    return 0; // Single data point has no correlation
  }

  const n = x.length;

  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate correlation components
  let numerator = 0;
  let sumSquaredDiffX = 0;
  let sumSquaredDiffY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    numerator += diffX * diffY;
    sumSquaredDiffX += diffX * diffX;
    sumSquaredDiffY += diffY * diffY;
  }

  // Handle case where one variable has no variance
  if (sumSquaredDiffX === 0 || sumSquaredDiffY === 0) {
    return 0;
  }

  const denominator = Math.sqrt(sumSquaredDiffX * sumSquaredDiffY);
  const correlation = numerator / denominator;

  // Ensure result is within bounds due to floating point precision
  return Math.max(-1, Math.min(1, correlation));
}

/**
 * Classify correlation strength based on coefficient value
 * @param {number} coefficient - Correlation coefficient
 * @returns {string} Strength classification
 */
export function classifyCorrelationStrength(coefficient) {
  const absCoeff = Math.abs(coefficient);
  
  if (absCoeff >= 0.7) {
    return 'Strong';
  } else if (absCoeff >= 0.4) {
    return 'Moderate';
  } else if (absCoeff >= 0.2) {
    return 'Weak';
  } else {
    return 'Very Weak';
  }
}

/**
 * Calculate p-value for correlation coefficient (simplified approximation)
 * Uses t-distribution approximation for significance testing
 * @param {number} r - Correlation coefficient
 * @param {number} n - Sample size
 * @returns {number} Approximate p-value
 */
export function calculatePValue(r, n) {
  // Handle edge cases
  if (n < 3) {
    return 1; // Not enough data for significance testing
  }

  if (Math.abs(r) === 1) {
    return 0; // Perfect correlation
  }

  // Calculate t-statistic
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const df = n - 2; // degrees of freedom

  // Simplified p-value approximation using t-distribution
  // This is a rough approximation; for production use a proper statistical library
  const absT = Math.abs(t);
  
  // Very rough approximation based on common critical values
  if (absT > 2.576) return 0.01;   // p < 0.01
  if (absT > 1.96) return 0.05;    // p < 0.05
  if (absT > 1.645) return 0.10;   // p < 0.10
  
  // For smaller t-values, use a simple approximation
  return Math.max(0, Math.min(1, 1 - (absT / 3)));
}

/**
 * Calculate complete correlation result with all metrics
 * @param {VolatilityPoint[]} volatilityData - Array of volatility points
 * @param {PopularityPoint[]} popularityData - Array of popularity points
 * @returns {CorrelationResult} Complete correlation analysis
 */
export function calculateCorrelation(volatilityData, popularityData) {
  // Align data by date
  const aligned = alignDataByDate(volatilityData, popularityData);
  
  // Handle case with no aligned data
  if (aligned.volatility.length === 0) {
    return {
      coefficient: 0,
      strength: 'Very Weak',
      pValue: 1,
      sampleSize: 0
    };
  }

  // Calculate correlation coefficient
  const coefficient = calculatePearsonCorrelation(aligned.volatility, aligned.popularity);
  
  // Classify strength
  const strength = classifyCorrelationStrength(coefficient);
  
  // Calculate p-value
  const pValue = calculatePValue(coefficient, aligned.volatility.length);
  
  return {
    coefficient: coefficient,
    strength: strength,
    pValue: pValue,
    sampleSize: aligned.volatility.length
  };
}
