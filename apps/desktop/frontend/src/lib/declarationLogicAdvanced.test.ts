/**
 * Advanced tests for edge cases in declaration logic
 */

import { determineDefaultDeclarationPeriod } from './declarationLogic'

// Test edge cases
const edgeCases = [
  {
    name: 'Edge Case 1: January -> December previous year',
    declarations: {},
    referenceDate: new Date(2025, 0, 15), // January 15, 2025
    expected: {
      periodKey: '2024-12', // December 2024
      reason: 'no_declarations'
    }
  },
  {
    name: 'Edge Case 2: December closed -> January next year',
    declarations: {
      '2024-12': { current_step: 'closed', closed_at: '2025-01-15' }
    },
    referenceDate: new Date(2025, 1, 15), // February 15, 2025
    expected: {
      periodKey: '2025-01', // January 2025
      reason: 'next_after_closed'
    }
  },
  {
    name: 'Real Example: August 14, 2025 (no declarations)',
    declarations: {},
    referenceDate: new Date(2025, 7, 14), // August 14, 2025 (today)
    expected: {
      periodKey: '2025-07', // July 2025
      reason: 'no_declarations'
    }
  },
  {
    name: 'Real Example: August 14 with July closed -> August',
    declarations: {
      '2025-07': { current_step: 'closed', closed_at: '2025-08-12' }
    },
    referenceDate: new Date(2025, 7, 14), // August 14, 2025
    expected: {
      periodKey: '2025-08', // August 2025
      reason: 'next_after_closed'
    }
  },
  {
    name: 'Multiple closed declarations - take the latest',
    declarations: {
      '2025-05': { current_step: 'closed', closed_at: '2025-06-10' },
      '2025-06': { current_step: 'closed', closed_at: '2025-07-10' },
      '2025-04': { current_step: 'closed', closed_at: '2025-05-10' },
      '2025-07': { current_step: 'declared' }
    },
    referenceDate: new Date(2025, 7, 20), // August 20, 2025
    expected: {
      periodKey: '2025-07', // July (next after June which is latest closed)
      reason: 'next_after_closed'
    }
  }
]

console.log('🚀 Testing Edge Cases for Declaration Logic...\n')

edgeCases.forEach((testCase, index) => {
  console.log(`🔍 ${testCase.name}`)
  
  const result = determineDefaultDeclarationPeriod(testCase.declarations, testCase.referenceDate)
  
  const success = result.periodKey === testCase.expected.periodKey && 
                 result.reason === testCase.expected.reason
  
  if (success) {
    console.log(`✅ PASS: Period = ${result.periodKey}, Reason = ${result.reason}`)
  } else {
    console.log(`❌ FAIL: Expected ${testCase.expected.periodKey} (${testCase.expected.reason}), got ${result.periodKey} (${result.reason})`)
  }
  
  console.log(`   Label: ${result.label}`)
  console.log(`   Reference Date: ${testCase.referenceDate.toDateString()}`)
  console.log('')
})

console.log('✨ Edge case tests completed!')