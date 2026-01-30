#!/usr/bin/env node

/**
 * Circular Dependency & Hoisting Issue Checker (Enhanced)
 * Finds circular imports and common initialization errors
 * 
 * Usage: node check-dependencies.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for Circular Dependencies & Hoisting Issues (Enhanced)\n');

const issues = [];
const warnings = [];
const fileImports = new Map();
const circularPaths = new Set();

// Directories to scan
const SCAN_DIRS = ['src'];
const IGNORE_PATTERNS = ['node_modules', '.next', 'dist', 'build', '.test.ts', '.spec.ts'];

// Alias mapping from vite.config.ts
const ALIASES = {
  '@': path.resolve('src')
};

// Find all JS/TS files
function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!IGNORE_PATTERNS.some(pattern => filePath.includes(pattern))) {
        findFiles(filePath, fileList);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      if (!IGNORE_PATTERNS.some(pattern => file.includes(pattern))) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Extract imports from a file
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  // Remove comments to avoid false matches
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  
  // Match ES6 imports
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(cleanContent)) !== null) {
    imports.push(match[1]);
  }
  
  // Match dynamic imports
  const dynamicImportRegex = /import\s*\(['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(cleanContent)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Resolve relative or aliased import to absolute path
function resolveImport(currentFile, importPath) {
  let resolved = null;
  
  // Handle aliases
  for (const [alias, aliasPath] of Object.entries(ALIASES)) {
    if (importPath === alias || importPath.startsWith(alias + '/')) {
      resolved = path.join(aliasPath, importPath.substring(alias.length));
      break;
    }
  }
  
  // Handle relative imports
  if (!resolved && importPath.startsWith('.')) {
    const currentDir = path.dirname(currentFile);
    resolved = path.resolve(currentDir, importPath);
  }
  
  if (!resolved) return null;
  
  // Try adding extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  for (const ext of extensions) {
    const withExt = resolved + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }
  
  return null;
}

// Check for common hoisting issues
function checkHoistingIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Remove comments and strings for better analysis
  const noComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const noStrings = noComments.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '""');
  const lines = noStrings.split('\n');
  
  lines.forEach((line, index) => {
    // Check for accessing variable before declaration
    // Simple check: const/let name = ... something that uses name ...
    const declMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(.*)/);
    if (declMatch) {
      const varName = declMatch[1];
      const rightSide = declMatch[2];
      
      // Check if varName is used on the right side of its own declaration
      const selfRefPattern = new RegExp(`\\b${varName}\\b`, 'g');
      if (selfRefPattern.test(rightSide)) {
        issues.push({
          file: fileName,
          type: 'Self-reference in declaration',
          line: index + 1,
          issue: `Variable '${varName}' references itself in its own initialization`,
          fix: 'Ensure variable is not used before it is fully initialized'
        });
      }
    }
  });
}

// Find circular dependencies using DFS
function findCircularDeps(file, visited = new Set(), stack = new Set(), pathList = []) {
  if (stack.has(file)) {
    // Found a cycle
    const cycleStart = pathList.indexOf(file);
    const cycle = [...pathList.slice(cycleStart), file];
    const cycleString = cycle.map(f => path.basename(f)).join(' → ');
    
    if (!circularPaths.has(cycleString)) {
      circularPaths.add(cycleString);
      issues.push({
        type: 'Circular Dependency',
        cycle: cycleString,
        files: cycle,
        fix: 'Refactor to remove circular imports or use dynamic imports'
      });
    }
    return;
  }
  
  if (visited.has(file)) return;
  
  visited.add(file);
  stack.add(file);
  pathList.push(file);
  
  const imports = fileImports.get(file) || [];
  imports.forEach(importPath => {
    const resolved = resolveImport(file, importPath);
    if (resolved) {
      findCircularDeps(resolved, visited, new Set(stack), [...pathList]);
    }
  });
}

// Check for duplicate exports/imports
function checkDuplicates(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Check for duplicate imports
  const imports = content.match(/import\s+.*from\s+['"][^'"]+['"]/g) || [];
  const importSources = imports.map(imp => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1]);
  const duplicates = importSources.filter((item, index) => item && importSources.indexOf(item) !== index);
  
  if (duplicates.length > 0) {
    warnings.push({
      file: fileName,
      issue: 'Duplicate imports detected',
      duplicates: [...new Set(duplicates)],
      fix: 'Combine imports from the same source'
    });
  }
}

// Main execution
console.log('📁 Scanning project files...\n');

// Find all files to check
let allFiles = [];
SCAN_DIRS.forEach(dir => {
  allFiles = allFiles.concat(findFiles(dir));
});

if (allFiles.length === 0) {
  console.log('⚠️  No source files found in:', SCAN_DIRS.join(', '));
  process.exit(0);
}

console.log(`Found ${allFiles.length} files to analyze\n`);

// Build import map
console.log('🔗 Building dependency graph...');
let totalImports = 0;
allFiles.forEach(file => {
  const imports = extractImports(file);
  fileImports.set(file, imports);
  totalImports += imports.length;
});
console.log(`Building graph with ${totalImports} imports...\n`);

// Check each file
console.log('🔍 Analyzing files...\n');
allFiles.forEach(file => {
  checkHoistingIssues(file);
  checkDuplicates(file);
});

// Find circular dependencies
console.log('🔄 Checking for circular dependencies...\n');
allFiles.forEach(file => {
  findCircularDeps(file);
});

// Print results
console.log('='.repeat(70));
console.log('📊 RESULTS\n');
console.log('='.repeat(70));
console.log('');

if (issues.length > 0) {
  console.log('❌ CRITICAL ISSUES FOUND:\n');
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.type || 'Issue'}`);
    if (issue.file) console.log(`   File: ${issue.file}`);
    if (issue.line) console.log(`   Line: ${issue.line}`);
    if (issue.cycle) console.log(`   Cycle: ${issue.cycle}`);
    if (issue.issue) console.log(`   Issue: ${issue.issue}`);
    console.log(`   Fix: ${issue.fix}`);
    console.log('');
  });
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach((warning, i) => {
    console.log(`${i + 1}. ${warning.file || 'General'}`);
    if (warning.line) console.log(`   Line: ${warning.line}`);
    console.log(`   Issue: ${warning.issue}`);
    if (warning.duplicates) console.log(`   Sources: ${warning.duplicates.join(', ')}`);
    console.log(`   Fix: ${warning.fix}`);
    console.log('');
  });
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No circular dependencies or hoisting issues detected!\n');
}

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  filesScanned: allFiles.length,
  issues,
  warnings
};

fs.writeFileSync('dependency-report.json', JSON.stringify(report, null, 2));
console.log('📄 Detailed report saved to: dependency-report.json\n');