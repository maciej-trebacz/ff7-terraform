import { describe, it, expect, beforeEach } from 'vitest';
import { Worldscript } from './worldscript';
import { EvFile } from './evfile';
import fs from 'fs';
import path from 'path';

describe('Worldscript decompiler', () => {
  let worldscript: Worldscript;
  
  beforeEach(() => {
    worldscript = new Worldscript(0x181e);
  });
  
  it('should decompile script correctly', () => {
    const script = `
RESET
PUSH_CONSTANT 0E
DIST_MODEL
PUSH_CONSTANT 64
LE
GOTO_IF_FALSE 1828
STOP
RESET
PUSH_SAVEMAP_WORD 00
PUSH_CONSTANT 062C
LT
GOTO_IF_FALSE 183F
RESET
PUSH_CONSTANT 0E
DIST_POINT
PUSH_CONSTANT 0100
LE
GOTO_IF_FALSE 183D
RESET
PUSH_CONSTANT 03
CALL_FN_20
GOTO 1856
RESET
PUSH_SAVEMAP_WORD 00
PUSH_CONSTANT 062C
EQ
GOTO_IF_FALSE 1856
RESET
PUSH_CONSTANT 0E
DIST_POINT
PUSH_CONSTANT 0100
LE
GOTO_IF_FALSE 1856
RESET
PUSH_CONSTANT 34
PUSH_CONSTANT 00
ENTER_FIELD
RESET
PUSH_SAVEMAP_WORD 00
PUSH_CONSTANT 063C
EQ
GOTO_IF_FALSE 1879
RESET
PUSH_CONSTANT 09
DIST_POINT
PUSH_CONSTANT 0100
LE
GOTO_IF_FALSE 1879
RESET
PUSH_SAVEMAP_WORD 00
PUSH_CONSTANT 063E
WRITE
RESET
PUSH_CONSTANT 34
PUSH_CONSTANT 00
ENTER_FIELD
RESET
PUSH_SAVEMAP_BIT 1C2E
PUSH_CONSTANT 01
WRITE
RETURN`;

    const expected = `if Entity.distance_to_entity(Entities.gold_saucer) <= 100 then
  Entity.stop()
end
if Savemap.game_progress < 1580 then
  if Entity.distance_to_point(14) <= 256 then
    System.call_function(20, Entities.highwind)
  end
  goto label_1856
end
if Savemap.game_progress == 1580 then
  if Entity.distance_to_point(14) <= 256 then
    System.enter_field(Fields.highwind_bridge_5, 0)
  end
end
::label_1856::
if Savemap.game_progress == 1596 then
  if Entity.distance_to_point(9) <= 256 then
    Memory.write(Savemap.game_progress, 1598)
    System.enter_field(Fields.highwind_bridge_5, 0)
    Memory.write(Savemap.bit(0xF29, 6), 1)
  end
end
return`;

    const result = worldscript.decompile(script);
    expect(result.trim()).toBe(expected);
  });

  it('should decompile system function 2 correctly (contains back-reference goto)', () => {
    const filePath = path.resolve('data/wm0.ev');
    const fileData = fs.readFileSync(filePath);
    const evFile = new EvFile(new Uint8Array(fileData.buffer));
    const script = evFile.functions[2].script;
    worldscript = new Worldscript(evFile.functions[2].offset);
    const result = worldscript.decompile(script);

    const expected = `
if Savemap.byte(0xF25) then
  Memory.write(Savemap.byte(0xF25), Savemap.byte(0xF25) - 1)
  if Savemap.byte(0xF25) == 0 then
    System.reset_zolom()
  end
end
return
`;

    expect(result.trim()).toBe(expected.trim());
  })  

  it('should decompile system function 15 correctly (contains back-reference goto)', () => {
    const filePath = path.resolve('data/wm0.ev');
    const fileData = fs.readFileSync(filePath);
    const evFile = new EvFile(new Uint8Array(fileData.buffer));
    const script = evFile.functions[15].script;
    worldscript = new Worldscript(evFile.functions[15].offset);
    const result = worldscript.decompile(script);

    const expected = `
System.set_control_lock(0)
System.set_encounters(0)
Entity.face_point(3)
if !Savemap.bit(0xF28, 2) then
  Window.wait_until_ready()
  Window.set_dimensions(100, 160, 120, 41)
  Window.set_params(0, 1)
  Window.wait_until_ready()
  Window.set_message(20)
  Entity.play_animation(6, 0)
  Entity.set_movespeed(20)
  System.wait(40)
  Window.wait_until_ready()
  Window.wait_until_ready()
  Window.set_dimensions(110, 160, 100, 41)
  Window.set_params(0, 1)
  Window.wait_until_ready()
  Window.set_message(21)
  Entity.play_animation(0, 1)
  Entity.set_movespeed(20)
  Entity.set_direction_facing(Special.entity_direction + 128)
  ::label_e9a::
  if Special.value_0D then
    System.wait(1)
    goto label_e9a
  end
  Window.wait_until_ready()
  Entity.set_movespeed(0)
  System.wait(10)
  Entity.set_direction_facing(Special.entity_direction + 128)
  Entity.play_animation(7, 0)
  Window.wait_until_ready()
  Window.set_dimensions(70, 160, 180, 57)
  Window.set_params(0, 0)
  Window.wait_until_ready()
  Window.set_message(22)
  Window.wait_for_acknowledge()
  Memory.write(Savemap.bit(0xF28, 2), 1)
  goto label_f20
end
Entity.set_movespeed(40)
Entity.set_direction_facing(Special.entity_direction + 128)
::label_ee7::
if Special.value_0D then
  System.wait(1)
  goto label_ee7
end
Entity.set_movespeed(0)
System.wait(10)
Entity.set_direction_facing(Special.entity_direction + 128)
Entity.play_animation(7, 0)
Window.wait_until_ready()
Window.set_dimensions(30, 160, 260, 57)
Window.set_params(0, 0)
Window.wait_until_ready()
Window.set_message(23)
Window.wait_for_acknowledge()
::label_f20::
Entity.play_animation(0, 1)
System.set_control_lock(1)
System.set_encounters(1)
return
`;

    expect(result.trim()).toBe(expected.trim());
  })

  it('should handle scripts with model related opcodes', () => {
    worldscript = new Worldscript(0x2BD2);
    const script = `
RESET
PUSH_SPECIAL_BYTE 08
PUSH_CONSTANT 00
EQ
GOTO_IF_FALSE 2BE2
RESET
PUSH_CONSTANT 2F
PUSH_CONSTANT 00
ENTER_FIELD
GOTO 2BF4
RESET
PUSH_SPECIAL_BYTE 08
PUSH_CONSTANT 01
EQ
PUSH_SPECIAL_BYTE 08
PUSH_CONSTANT 02
EQ
LOR
GOTO_IF_FALSE 2BF4
RESET
PUSH_SPECIAL_BYTE 08
CALL_FN_31
RETURN`;

    const expected = `if Special.player_entity_model_id == Entities.cloud then
  System.enter_field(Fields.icicle_village_north, 0)
  goto label_2bf4
end
if Special.player_entity_model_id == Entities.tifa or Special.player_entity_model_id == Entities.cid then
  System.call_function(31, Special.player_entity_model_id)
end
::label_2bf4::
return`;

    const result = worldscript.decompile(script);
    expect(result.trim()).toBe(expected);
  });

  it('should handle scripts with more complex math and wait frames', () => {
    const script = `
RESET
PUSH_CONSTANT 0B
PLAY_SFX
RESET
PUSH_CONSTANT 00
SET_CONTROLS
RESET
PUSH_CONSTANT 14
SET_WALK_SPEED
RESET
PUSH_SPECIAL_BYTE 04
SET_DIR
RESET
PUSH_SPECIAL_BYTE 04
PUSH_CONSTANT 80
ADD
SET_MOVE_DIR
RESET
PUSH_CONSTANT FA
PUSH_CONSTANT 00
FADE_OUT
RESET
PUSH_CONSTANT 03
WAIT_FRAMES
WAIT
RESET
PUSH_CONSTANT FA
PUSH_CONSTANT 00
FADE_IN
RESET
PUSH_CONSTANT 03
WAIT_FRAMES
WAIT
RESET
PUSH_CONSTANT 00
SET_SPEED
RETURN`;

    const expected = `Sound.play_sfx(11)
System.set_control_lock(0)
Entity.set_walk_speed(20)
Entity.set_direction_facing(Special.entity_direction)
Entity.set_movement_direction(Special.entity_direction + 128)
System.fade_out(250, 0)
System.wait(3)
System.fade_in(250, 0)
System.wait(3)
Entity.set_movespeed(0)
return`;

    const result = worldscript.decompile(script);
    expect(result.trim()).toBe(expected);
  });

  it('should handle scripts with temp vars', () => {
    const script = `
RESET
PUSH_TEMP_BYTE 03
PUSH_CONSTANT 50
ADD
PUSH_CONSTANT 012C
ADJUST_POS
RESET
PUSH_TEMP_BYTE 03
PUSH_CONSTANT C0
ADD
SET_DIR`;

    const expected = `
Entity.adjust_position_outside_vehicle(Temp.byte(0x3) + 80, 300)
Entity.set_direction_facing(Temp.byte(0x3) + 192)
`;

    const result = worldscript.decompile(script);
    expect(result.trim()).toBe(expected.trim());
  });

  it('should handle empty scripts', () => {
    const result = worldscript.decompile('');
    expect(result.trim()).toBe('');
  });
  
  it('should throw an error for invalid opcodes', () => {
    const invalidScript = `
INVALID_OPCODE 00
`;
    
    expect(() => worldscript.decompile(invalidScript)).toThrow();
  });
  
  it('should correctly handle function calls', () => {
    const script = `
PUSH_CONSTANT 05
PUSH_CONSTANT 0A
ADD
PLAY_SFX
`;

    const expected = `Sound.play_sfx(5 + 10)`;

    const result = worldscript.decompile(script);
    expect(result.trim()).toBe(expected);
  });

  it('should correctly handle simplified wait calls', () => {
    // Original script with WAIT_FRAMES and WAIT
    const originalScript = `
RESET
PUSH_CONSTANT 1E
WAIT_FRAMES
WAIT
RETURN`;

    // Decompile the script
    const worldscript = new Worldscript(0);
    const decompiled = worldscript.decompile(originalScript);
    
    // Verify the decompiled script has the simplified System.wait(30) format
    expect(decompiled.trim()).toBe('System.wait(30)\nreturn');
    
    // Recompile the decompiled script
    const recompiled = worldscript.compile(decompiled);
    
    // Verify the recompiled script has both WAIT_FRAMES and WAIT opcodes
    expect(recompiled.trim()).toContain('WAIT_FRAMES');
    expect(recompiled.trim()).toContain('WAIT');
    
    // Decompile the recompiled script to verify it's the same as the original decompiled script
    const redecompiled = worldscript.decompile(recompiled);
    expect(redecompiled.trim()).toBe('System.wait(30)\nreturn');
  });
});

describe('Worldscript compiler', () => {
  let worldscript: Worldscript;
  
  beforeEach(() => {
    worldscript = new Worldscript(0x181e);
  });

  it('should decompile and then compile system function 0 correctly', () => {
    const filePath = path.resolve('data/wm0.ev');
    const fileData = fs.readFileSync(filePath);
    const evFile = new EvFile(new Uint8Array(fileData.buffer));
    const script = evFile.functions[0].script;
    worldscript = new Worldscript(1);
    const decompiled = worldscript.decompile(script);
    const compiled = worldscript.compile(decompiled);
    expect(compiled.trim()).toBe(script.trim());
  });

  it('should compile custom script correctly', () => {
    const script = `
if Entity.distance_to_entity(Entities.gold_saucer) <= 100 then
  Entity.stop()
end
if Savemap.game_progress < 1580 then
  if Entity.distance_to_point(14) <= 256 then
    System.call_function(20, Entities.highwind)
  end
  goto label_1856
end
if Savemap.game_progress == 1580 then
  if Entity.distance_to_point(14) <= 256 then
    System.enter_field(Fields.highwind_bridge_5, 0)
  end
end
::label_1856::
if Savemap.game_progress == 1596 then
  if Entity.distance_to_point(9) <= 256 then
    Memory.write(Savemap.game_progress, 1598)
    System.enter_field(Fields.highwind_bridge_5, 0)
  end
end
return
`;

    const expected = `
RESET
PUSH_CONSTANT 0E
DIST_MODEL
PUSH_CONSTANT 64
LE
GOTO_IF_FALSE 1828
STOP
RESET
PUSH_SAVEMAP_WORD 00
PUSH_CONSTANT 062C
LT
GOTO_IF_FALSE 183F
RESET
PUSH_CONSTANT 0E
DIST_POINT
PUSH_CONSTANT 0100
LE
GOTO_IF_FALSE 183D
RESET
PUSH_CONSTANT 03
CALL_FN_20
GOTO 1856
RESET
PUSH_SAVEMAP_WORD 00
PUSH_CONSTANT 062C
EQ
GOTO_IF_FALSE 1856
RESET
PUSH_CONSTANT 0E
DIST_POINT
PUSH_CONSTANT 0100
LE
GOTO_IF_FALSE 1856
RESET
PUSH_CONSTANT 34
PUSH_CONSTANT 00
ENTER_FIELD
RESET
PUSH_SAVEMAP_WORD 00
PUSH_CONSTANT 063C
EQ
GOTO_IF_FALSE 1873
RESET
PUSH_CONSTANT 09
DIST_POINT
PUSH_CONSTANT 0100
LE
GOTO_IF_FALSE 1873
RESET
PUSH_SAVEMAP_WORD 00
PUSH_CONSTANT 063E
WRITE
RESET
PUSH_CONSTANT 34
PUSH_CONSTANT 00
ENTER_FIELD
RETURN
`;

    const result = worldscript.compile(script);
    expect(result.trim()).toBe(expected.trim());
  });

  it('should compile scripts with unary operators correctly', () => {
    worldscript = new Worldscript(0x1000);
    const script = `
if !Temp.word(0) then
  Entity.stop()
end
Memory.write(Temp.word(1), -Temp.word(1))
return
`;

    const expected = `
RESET
PUSH_TEMP_WORD 00
NOT
GOTO_IF_FALSE 1007
STOP
RESET
PUSH_TEMP_WORD 01
PUSH_TEMP_WORD 01
NEG
WRITE
RETURN
`;

    const result = worldscript.compile(script);
    expect(result.trim()).toBe(expected.trim());
  });
});
