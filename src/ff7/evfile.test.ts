import { describe, it, expect, beforeEach } from 'vitest';
import { EvFile, FunctionType } from './evfile';
import fs from 'fs';
import path from 'path';
import { Worldscript } from './worldscript/worldscript';

describe('EvFile', () => {
  let evFile: EvFile;
  
  beforeEach(() => {
    const filePath = path.resolve('data/wm0.ev');
    const fileData = fs.readFileSync(filePath);
    evFile = new EvFile(new Uint8Array(fileData.buffer));
  });
  
  it('should parse the file correctly', () => {
    expect(evFile).toBeInstanceOf(EvFile);
    expect(evFile.functions.length).toBeGreaterThan(0);
  });
  
  it('should identify system functions', () => {
    const systemFunctions = evFile.getSystemFunctions();
    expect(systemFunctions.length).toBe(32);
    
    systemFunctions.forEach(fn => {
      expect(fn.type).toBe(FunctionType.System);
    });
  });
  
  it('should identify model functions', () => {
    const modelFunctions = evFile.getModelFunctions();
    expect(modelFunctions.length).toBe(61);
    
    modelFunctions.forEach(fn => {
      expect(fn.type).toBe(FunctionType.Model);
      expect(fn.modelId).toBeTypeOf('number');
    });
  });
  
  it('should identify mesh functions', () => {
    const meshFunctions = evFile.getMeshFunctions();
    expect(meshFunctions.length).toBe(49);
    
    meshFunctions.forEach(fn => {
      expect(fn.type).toBe(FunctionType.Mesh);
      expect(fn.x).toBeTypeOf('number');
      expect(fn.y).toBeTypeOf('number');
    });
  });
  
  it('should encode and decode opcodes correctly', () => {
    // Create a simple, known opcode sequence
    // Using RESET (0x100), PUSH_CONSTANT (0x110) with param 0x01, and RETURN (0x203)
    const knownOpcodes = [0x100, 0x110, 0x01, 0x203];
    
    // Decode opcodes to script
    const script = evFile.decodeOpcodes(knownOpcodes);
    expect(script).toBe("RESET\nPUSH_CONSTANT 01\nRETURN");
    
    // Encode script back to opcodes
    const encodedData = evFile.encodeOpcodes(script);
    
    // The re-encoded opcodes should exactly match the original opcodes
    expect(encodedData.length).toBe(knownOpcodes.length);
    
    // Compare each opcode individually
    for (let i = 0; i < knownOpcodes.length; i++) {
      expect(
        encodedData[i],
        `Opcode at index ${i} doesn't match: expected 0x${knownOpcodes[i].toString(16)} but got 0x${encodedData[i].toString(16)}`
      ).toBe(knownOpcodes[i]);
    }
  });
  
  it('should handle special CALL_FN_X opcodes correctly', () => {
    // Test case for CALL_FN_X opcodes which take parameters from the stack, not from code
    const specialOpcodes = [0x205]; // CALL_FN_1 (without any parameter in the opcode stream)
    
    // Decode opcodes to script
    const script = evFile.decodeOpcodes(specialOpcodes);
    expect(script).toBe("CALL_FN_1");
    
    // Encode script back to opcodes
    const encodedData = evFile.encodeOpcodes(script);
    
    // The re-encoded opcodes should exactly match the original opcodes
    expect(encodedData.length).toBe(specialOpcodes.length);
    
    // Compare each opcode individually
    for (let i = 0; i < specialOpcodes.length; i++) {
      expect(
        encodedData[i],
        `Opcode at index ${i} doesn't match: expected 0x${specialOpcodes[i].toString(16)} but got 0x${encodedData[i].toString(16)}`
      ).toBe(specialOpcodes[i]);
    }
    
    // Test a few more in the range to ensure they all work correctly
    const moreSpecialOpcodes = [
      0x204, // CALL_FN_0
      0x20A, // CALL_FN_6
      0x22F  // CALL_FN_43 (max value in range)
    ];
    
    for (const opcode of moreSpecialOpcodes) {
      const fnNumber = opcode - 0x204;
      const expectedScript = `CALL_FN_${fnNumber}`;
      
      const decodedScript = evFile.decodeOpcodes([opcode]);
      expect(decodedScript).toBe(expectedScript);
      
      const reEncodedData = evFile.encodeOpcodes(decodedScript);
      
      // Check if re-encoded data matches original opcode
      expect(reEncodedData[0]).toBe(opcode);
    }
  });
  
  it('should write file and read it back correctly', () => {
    // Test - reading external script and writing it back to the wm0.ev file
    // const scriptPath = path.resolve('output/000_system_function0.lua');
    // const script = fs.readFileSync(scriptPath, 'utf8');
    // const worldscript = new Worldscript(evFile.functions[0].offset);
    // const compiled = worldscript.compile(script);
    // evFile.setFunctionScript(0, compiled);

    const writtenData = evFile.writeFile();
    expect(writtenData).toBeInstanceOf(Uint8Array);
    // const filePath = path.resolve('data/wm0-new.ev');
    // fs.writeFileSync(filePath, Buffer.from(writtenData));
    
    const newEvFile = new EvFile(writtenData);
    expect(newEvFile.functions.length).toBe(evFile.functions.length);
    expect(newEvFile.getSystemFunctions().length).toBe(evFile.getSystemFunctions().length);
    expect(newEvFile.getModelFunctions().length).toBe(evFile.getModelFunctions().length);
    expect(newEvFile.getMeshFunctions().length).toBe(evFile.getMeshFunctions().length);
  });

  it('should read a script, decompile, compile, write, and read it back correctly', () => {
    const funcId = 7;
    const opcodes = evFile.functions[funcId].opcodes;
    const script = evFile.decodeOpcodes(opcodes);
    const worldscript = new Worldscript(evFile.functions[funcId].offset);
    const decompiled = worldscript.decompile(script);
    const compiled = worldscript.compile(decompiled);
    evFile.setFunctionScript(funcId, compiled);
    const writtenData = evFile.writeFile();
    const newEvFile = new EvFile(writtenData);
    const newScript = newEvFile.functions[funcId].script;
    expect(newScript).toBe(script);
  });
});
