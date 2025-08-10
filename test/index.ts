import { parseTSON, compileTSONToJSON, compileTSONFiles, watchTSONFile, TSONParseError } from '../src/tson';
import path from 'path';
import fs from 'fs';

// Test the enhanced TSON functionality
console.log('🚀 Testing Enhanced TSON Functionality\n');

// Test 1: Basic TSON parsing with imports
console.log('📖 Test 1: Basic TSON parsing');
try {
  const configPath = path.join(__dirname, 'config.tson');
  const config = parseTSON(configPath);
  console.log('✅ Successfully parsed config.tson');
  console.log('📊 Config data:', JSON.stringify(config, null, 2));
} catch (error) {
  console.error('❌ Failed to parse config.tson:', error);
}

// Test 2: Create a sample TSON file with TSON imports
console.log('\n📝 Test 2: Creating TSON files with imports');

// Create a base configuration file
const baseConfigContent = `// Base configuration
{
  database: {
    host: "localhost",
    port: 5432,
    timeout: 30000
  },
  logging: {
    level: "info",
    format: "json"
  }
}`;

const baseConfigPath = path.join(__dirname, 'base-config.tson');
fs.writeFileSync(baseConfigPath, baseConfigContent, 'utf-8');
console.log('✅ Created base-config.tson');

// Create a main configuration that imports the base
const mainConfigContent = `// Main configuration with TSON import
import baseConfig from "./base-config.tson";

const API_VERSION = "v2";
const PORT = 8080;

{
  // Merge base configuration
  ...baseConfig,
  
  // Override and add new settings
  api: {
    version: API_VERSION,
    port: PORT,
    endpoints: {
      health: "/health",
      metrics: "/metrics"
    }
  },
  
  // Environment specific
  environment: "development",
  
  // Features enabled
  features: [
    "auth",
    "monitoring",
    "api-" + API_VERSION
  ]
}`;

const mainConfigPath = path.join(__dirname, 'main-config.tson');
fs.writeFileSync(mainConfigPath, mainConfigContent, 'utf-8');
console.log('✅ Created main-config.tson with TSON import');

// Test 3: Parse TSON file with imports
console.log('\n🔗 Test 3: Parsing TSON with imports');
try {
  const mainConfig = parseTSON(mainConfigPath, {
    allowTSONImports: true,
    strict: true
  });
  console.log('✅ Successfully parsed main-config.tson with imports');
  console.log('📊 Merged config:', JSON.stringify(mainConfig, null, 2));
} catch (error) {
  console.error('❌ Failed to parse main-config.tson:', error);
}

// Test 4: Compile TSON to JSON for production
console.log('\n🏗️ Test 4: Compiling TSON to JSON');
try {
  const outputDir = path.join(__dirname, 'dist');
  
  // Compile single file
  const outputPath = compileTSONToJSON(mainConfigPath, {
    outputDir,
    minify: false,
    preserveComments: true
  });
  console.log('✅ Compiled to JSON:', outputPath);
  
  // Read and display the compiled JSON
  const compiledContent = fs.readFileSync(outputPath, 'utf-8');
  console.log('📄 Compiled JSON content:');
  console.log(compiledContent);
  
  // Check if meta file was created
  const metaPath = path.join(outputDir, 'main-config.meta.json');
  if (fs.existsSync(metaPath)) {
    const metaContent = fs.readFileSync(metaPath, 'utf-8');
    console.log('📝 Meta file created with comments:', metaContent);
  }
} catch (error) {
  console.error('❌ Failed to compile TSON:', error);
}

// Test 5: Compile multiple files
console.log('\n📦 Test 5: Compiling multiple TSON files');
try {
  const inputFiles = [baseConfigPath, mainConfigPath];
  const outputPaths = compileTSONFiles(inputFiles, {
    outputDir: path.join(__dirname, 'dist'),
    minify: true
  });
  console.log('✅ Compiled multiple files:', outputPaths);
} catch (error) {
  console.error('❌ Failed to compile multiple files:', error);
}

// Test 6: Error handling
console.log('\n🚨 Test 6: Error handling');
try {
  // Try to parse a non-existent file
  parseTSON('non-existent.tson', { strict: true });
} catch (error) {
  if (error instanceof TSONParseError) {
    console.log('✅ Correctly caught TSONParseError:', error.message);
  } else {
    console.log('❌ Unexpected error type:', error);
  }
}

// Test 7: Watch functionality (commented out to avoid long-running process)
console.log('\n👀 Test 7: Watch functionality (demo)');
console.log('📝 Watch functionality available - use watchTSONFile() to auto-compile on changes');

// Example of how to use watch (commented out):
// const stopWatching = watchTSONFile(mainConfigPath, {
//   outputDir: path.join(__dirname, 'dist'),
//   minify: false
// });
// 
// // Stop watching after some time
// setTimeout(() => {
//   stopWatching();
//   console.log('Stopped watching file');
// }, 5000);

console.log('\n🎉 All tests completed!');
console.log('\n📚 Enhanced TSON Features:');
console.log('  ✨ TSON file imports for data combination');
console.log('  🏗️ Compilation to JSON for production');
console.log('  📦 Batch compilation of multiple files');
console.log('  👀 File watching with auto-compilation');
console.log('  💬 Comment preservation in meta files');
console.log('  🗜️ Minification support');
console.log('  🚨 Enhanced error handling');