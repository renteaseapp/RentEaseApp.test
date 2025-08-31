// Test script to verify rental calculation logic
// This script tests the calculateRentalDays function logic

function calculateRentalDays(startDateObj, endDateObj, selectedRentalType, numberOfWeeks, numberOfMonths) {
  if (selectedRentalType === 'weekly') {
    return numberOfWeeks * 7;
  } else if (selectedRentalType === 'monthly') {
    return numberOfMonths * 30;
  } else {
    // Daily calculation
    if (startDateObj && endDateObj) {
      const start = new Date(startDateObj);
      const end = new Date(endDateObj);
      
      if (end >= start) {
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      }
    }
    return 1; // Default fallback
  }
}

// Test cases
console.log('=== Testing Rental Days Calculation ===\n');

// Test 1: Weekly rental
console.log('Test 1: Weekly rental (2 weeks)');
const weeklyDays = calculateRentalDays(null, null, 'weekly', 2, 1);
console.log(`Expected: 14 days, Got: ${weeklyDays} days`);
console.log(`Result: ${weeklyDays === 14 ? 'PASS' : 'FAIL'}\n`);

// Test 2: Monthly rental
console.log('Test 2: Monthly rental (1 month)');
const monthlyDays = calculateRentalDays(null, null, 'monthly', 1, 1);
console.log(`Expected: 30 days, Got: ${monthlyDays} days`);
console.log(`Result: ${monthlyDays === 30 ? 'PASS' : 'FAIL'}\n`);

// Test 3: Daily rental - same day
console.log('Test 3: Daily rental - same day (2024-01-01 to 2024-01-01)');
const startDate1 = new Date('2024-01-01');
const endDate1 = new Date('2024-01-01');
const dailyDays1 = calculateRentalDays(startDate1, endDate1, 'daily', 1, 1);
console.log(`Expected: 1 day, Got: ${dailyDays1} days`);
console.log(`Result: ${dailyDays1 === 1 ? 'PASS' : 'FAIL'}\n`);

// Test 4: Daily rental - 3 days
console.log('Test 4: Daily rental - 3 days (2024-01-01 to 2024-01-03)');
const startDate2 = new Date('2024-01-01');
const endDate2 = new Date('2024-01-03');
const dailyDays2 = calculateRentalDays(startDate2, endDate2, 'daily', 1, 1);
console.log(`Expected: 3 days, Got: ${dailyDays2} days`);
console.log(`Result: ${dailyDays2 === 3 ? 'PASS' : 'FAIL'}\n`);

// Test 5: Daily rental - 7 days (1 week)
console.log('Test 5: Daily rental - 7 days (2024-01-01 to 2024-01-07)');
const startDate3 = new Date('2024-01-01');
const endDate3 = new Date('2024-01-07');
const dailyDays3 = calculateRentalDays(startDate3, endDate3, 'daily', 1, 1);
console.log(`Expected: 7 days, Got: ${dailyDays3} days`);
console.log(`Result: ${dailyDays3 === 7 ? 'PASS' : 'FAIL'}\n`);

// Test 6: Edge case - end date before start date
console.log('Test 6: Edge case - end date before start date');
const startDate4 = new Date('2024-01-05');
const endDate4 = new Date('2024-01-01');
const dailyDays4 = calculateRentalDays(startDate4, endDate4, 'daily', 1, 1);
console.log(`Expected: 1 day (fallback), Got: ${dailyDays4} days`);
console.log(`Result: ${dailyDays4 === 1 ? 'PASS' : 'FAIL'}\n`);

console.log('=== Test Summary ===');
const allTests = [
  weeklyDays === 14,
  monthlyDays === 30,
  dailyDays1 === 1,
  dailyDays2 === 3,
  dailyDays3 === 7,
  dailyDays4 === 1
];
const passedTests = allTests.filter(test => test).length;
console.log(`Passed: ${passedTests}/${allTests.length} tests`);
console.log(`Overall: ${passedTests === allTests.length ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);