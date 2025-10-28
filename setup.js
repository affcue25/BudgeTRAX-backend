#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 BudgetWise Backend Setup');
console.log('============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
} else {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully');
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
}

console.log('\n📋 Next steps:');
console.log('1. Edit the .env file with your Supabase credentials');
console.log('2. Get your Supabase credentials from: https://supabase.com/dashboard');
console.log('3. Run the database schema: database/schema.sql in Supabase SQL Editor');
console.log('4. Start the development server: npm run dev');
console.log('\n🔗 Supabase Setup:');
console.log('- Go to your Supabase project dashboard');
console.log('- Navigate to Settings > API');
console.log('- Copy the Project URL and anon/public key');
console.log('- Navigate to SQL Editor and run database/schema.sql');
console.log('\n✨ Happy coding!');
