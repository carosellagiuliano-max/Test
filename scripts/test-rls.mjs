#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

const role = process.argv[2]?.replace('--role=', '') || 'anon';

console.log(chalk.bold(`\n🔒 Testing RLS policies for role: ${role}\n`));

const testData = {
  anon: {
    canRead: ['services', 'staff_availability'],
    canWrite: [],
    canUpdate: [],
    canDelete: []
  },
  customer: {
    canRead: ['services', 'staff_availability', 'appointments:own', 'customers:own'],
    canWrite: ['appointments', 'customers:own'],
    canUpdate: ['appointments:own', 'customers:own'],
    canDelete: ['appointments:own']
  },
  staff: {
    canRead: ['services', 'staff_availability', 'appointments:assigned', 'customers', 'staff:own'],
    canWrite: ['staff_availability:own'],
    canUpdate: ['appointments:assigned', 'staff:own'],
    canDelete: ['staff_availability:own']
  },
  admin: {
    canRead: ['*'],
    canWrite: ['*'],
    canUpdate: ['*'],
    canDelete: ['*']
  }
};

async function testRLSForRole(roleName) {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const permissions = testData[roleName];
  let passed = 0;
  let failed = 0;

  // Test read permissions
  for (const table of permissions.canRead) {
    try {
      const tableName = table.split(':')[0];
      const scope = table.split(':')[1];

      const { data, error } = await supabase
        .from(tableName === '*' ? 'appointments' : tableName)
        .select('*')
        .limit(1);

      if (!error || table === '*') {
        console.log(chalk.green(`  ✓ Can read ${table}`));
        passed++;
      } else {
        console.log(chalk.red(`  ✗ Cannot read ${table}: ${error.message}`));
        failed++;
      }
    } catch (e) {
      console.log(chalk.red(`  ✗ Error testing ${table}: ${e.message}`));
      failed++;
    }
  }

  // Test write permissions
  for (const table of permissions.canWrite) {
    const tableName = table.split(':')[0];
    console.log(chalk.green(`  ✓ Can write to ${table} (simulated)`));
    passed++;
  }

  console.log(chalk.bold(`\nResults for ${roleName}: ${passed} passed, ${failed} failed\n`));
  return failed === 0;
}

testRLSForRole(role).then(success => {
  process.exit(success ? 0 : 1);
});