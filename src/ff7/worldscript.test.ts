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
System.wait(System.wait_frames(3))
System.fade_in(250, 0)
System.wait(System.wait_frames(3))
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
