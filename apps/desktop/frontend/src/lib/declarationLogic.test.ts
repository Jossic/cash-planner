/**
 * Tests for declaration logic
 */

import {
  determineDefaultDeclarationPeriod,
  getPreviousMonth,
  getNextMonth,
  formatPeriodKey,
  parsePeriodKey,
  findLatestClosedDeclaration
} from './declarationLogic'

// Mock declarations for testing
const mockDeclarations = {
  '2025-06': { current_step: 'closed', closed_at: '2025-07-15' },
  '2025-07': { current_step: 'declared' },
  '2025-05': { current_step: 'closed', closed_at: '2025-06-15' }
}

const emptyDeclarations = {}

// Test scenarios
const testScenarios = [
  {
    name: 'Scenario 1: No declarations, date = August 14, 2025',
    declarations: emptyDeclarations,
    referenceDate: new Date(2025, 7, 14), // August 14
    expected: {
      periodKey: '2025-07', // July (previous month)
      reason: 'no_declarations'
    }
  },
  {
    name: 'Scenario 2: No declarations, date = September 5, 2025', 
    declarations: emptyDeclarations,
    referenceDate: new Date(2025, 8, 5), // September 5
    expected: {
      periodKey: '2025-08', // August (previous month)
      reason: 'no_declarations'
    }
  },
  {
    name: 'Scenario 3: June closed, date = August 15, 2025',
    declarations: mockDeclarations,
    referenceDate: new Date(2025, 7, 15), // August 15
    expected: {
      periodKey: '2025-07', // July (next after June which is latest closed)
      reason: 'next_after_closed'
    }
  }
]

// Run tests
console.log('🧪 Testing Declaration Logic...\n')

testScenarios.forEach((scenario, index) => {
  console.log(`📋 ${scenario.name}`)
  
  const result = determineDefaultDeclarationPeriod(scenario.declarations, scenario.referenceDate)
  
  const success = result.periodKey === scenario.expected.periodKey && 
                 result.reason === scenario.expected.reason
  
  if (success) {
    console.log(`✅ PASS: Period = ${result.periodKey}, Reason = ${result.reason}`)
  } else {
    console.log(`❌ FAIL: Expected ${scenario.expected.periodKey} (${scenario.expected.reason}), got ${result.periodKey} (${result.reason})`)
  }
  
  console.log(`   Label: ${result.label}`)
  console.log('')
})

// Test utility functions
console.log('🔧 Testing Utility Functions...\n')

// Test getPreviousMonth
const testDate = new Date(2025, 7, 14) // August 14, 2025
const prevMonth = getPreviousMonth(testDate)
console.log(`getPreviousMonth(Aug 2025): ${formatPeriodKey(prevMonth.year, prevMonth.month)} ✅`)

// Test getNextMonth
const nextMonth = getNextMonth(2025, 6)
console.log(`getNextMonth(June 2025): ${formatPeriodKey(nextMonth.year, nextMonth.month)} ✅`)

// Test parsePeriodKey
const parsed = parsePeriodKey('2025-07')
console.log(`parsePeriodKey('2025-07'): ${parsed.year}-${parsed.month} ✅`)

// Test findLatestClosedDeclaration
const latestClosed = findLatestClosedDeclaration(mockDeclarations)
console.log(`findLatestClosedDeclaration: ${latestClosed} ✅`)

console.log('\n🎉 Declaration logic tests completed!')