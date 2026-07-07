/**
 * Simple Loader for Photo Printer Free
 * Directly loads and executes main.cjs (no encryption, no license checks).
 */

const path = require('path');
const Module = require('module');
const fs = require('fs');

// Directly load and execute main.cjs
const mainFilename = path.join(__dirname, 'main.cjs');
const code = fs.readFileSync(mainFilename, 'utf8');
module.filename = mainFilename;
module.paths = Module._nodeModulePaths(__dirname);
module._compile(code, mainFilename);
