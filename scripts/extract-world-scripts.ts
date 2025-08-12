#!/usr/bin/env node

import { EvFile, FF7Function, FunctionType, SystemFunction, ModelFunction, MeshFunction } from '../src/ff7/evfile';
import { Worldscript } from '../src/ff7/worldscript/worldscript';
import fs from 'fs';
import path from 'path';

// Import the models mapping
// This mapping is from model ID to readable name
const modelsMapping: Record<string, string> = {
  0: 'cloud',
  1: 'tifa',
  2: 'cid',
  3: 'highwind',
  4: 'wild_chocobo',
  5: 'tiny_bronco',
  6: 'buggy',
  7: 'junon_cannon',
  8: 'cargo_ship',
  9: 'highwind_propellers',
  10: 'diamond_weapon',
  11: 'ultima_weapon',
  12: 'fort_condor',
  13: 'submarine',
  14: 'gold_saucer',
  15: 'rocket_town_rocket',
  16: 'rocket_town',
  17: 'sunken_gelnika',
  18: 'underwater_reactor',
  19: 'chocobo',
  20: 'midgar_cannon',
  21: 'unknown_21',
  22: 'unknown_22',
  23: 'unknown_23',
  24: 'north_crater_barrier',
  25: 'ancient_forest',
  26: 'key_of_the_ancients',
  27: 'unknown_27',
  28: 'red_submarine',
  29: 'ruby_weapon',
  30: 'emerald_weapon',
  65535: 'system'
};

// Function to kebab-case a string
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

// Check if file path was provided
if (process.argv.length < 3) {
  console.error('Please provide a path to an .ev file');
  process.exit(1);
}

// Get the file path from command line arguments
const filePath = process.argv[2];

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Check if file has .ev extension
if (!filePath.toLowerCase().endsWith('.ev')) {
  console.warn('Warning: The provided file does not have an .ev extension');
}

// Create output directory if it doesn't exist
const outputDir = path.resolve('output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

// Read the file
console.log(`Reading file: ${filePath}`);
const fileData = fs.readFileSync(filePath);

// Parse the file
console.log('Parsing .ev file...');
const evFile = new EvFile(new Uint8Array(fileData));

const evFilename = path.basename(filePath);

// Process all functions
console.log(`Found ${evFile.functions.length} functions to process`);

evFile.functions.forEach((fn, index) => {
  try {
    // Pad index to 3 digits
    const paddedIndex = index.toString().padStart(3, '0');
    
    // Start building filename with index
    let filename = `${paddedIndex}_`;
    
    // Add function type and specific info
    switch (fn.type) {
      case FunctionType.System:
        filename += `system_function${fn.id ?? 'unknown'}.lua`;
        break;
      
      case FunctionType.Model:
        const modelFn = fn as ModelFunction;
        const modelId = modelFn.modelId.toString();
        const modelName = modelsMapping[modelId] || `unknown_model_${modelId}`;
        filename += `model_${modelName}_function${fn.id ?? 'unknown'}.lua`;
        break;
      
      case FunctionType.Mesh:
        const meshFn = fn as MeshFunction;
        filename += `mesh_${meshFn.x}_${meshFn.y}_function${fn.id ?? 'unknown'}.lua`;
        break;
    }
    
    const outputPath = path.join(outputDir, evFilename + '_' + filename);
    
    // Check if this is an aliased function (no opcodes but has aliasId)
    if (!fn.opcodes && fn.aliasId !== undefined) {
      // For aliased functions, just write a comment indicating it points to another function
      const content = `# Dummy function, points to System function ${fn.aliasId}`;
      fs.writeFileSync(outputPath, content);
      console.log(`Extracted aliased script to: ${outputPath}`);
    } else {
      // For normal functions with opcodes, decompile the script
      const worldScript = new Worldscript(fn.offset, false);
      const decompiled = worldScript.decompile(fn.script, true);
      fs.writeFileSync(outputPath, decompiled);
      console.log(`Extracted script to: ${outputPath}`);
    }
  } catch (error) {
    console.error(`Error processing function ${index}:`, error);
  }
});

console.log('Done!'); 