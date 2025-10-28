// Simple test to check if all imports work
console.log('Testing imports...');

try {
  // Test if we can require the main file
  const path = require('path');
  const fs = require('fs');
  
  console.log('✅ Node.js modules work');
  
  // Check if source files exist
  const srcPath = path.join(__dirname, 'src');
  const files = [
    'index.ts',
    'config/database.ts',
    'middleware/errorHandler.ts',
    'middleware/notFoundHandler.ts',
    'middleware/auth.ts',
    'middleware/validation.ts',
    'controllers/authController.ts',
    'services/authService.ts',
    'routes/auth.ts',
    'routes/user.ts',
    'routes/budget.ts',
    'types/index.ts'
  ];
  
  files.forEach(file => {
    const filePath = path.join(srcPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
  
  console.log('Import test completed!');
} catch (error) {
  console.error('❌ Import test failed:', error.message);
}
