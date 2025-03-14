export type OpcodeDefinition = {
  name: string;
  stackParams: number;
  codeParams: number;
  mnemonic: Mnemonic;
  namespace: Namespace;
  description: string;
  pushesResult?: boolean;
};

export enum Namespace {
  System = "System",
  Math = "Math",
  Entity = "Entity",
  Point = "Point",
  Camera = "Camera",
  Sound = "Sound",
  Memory = "Memory",
  Window = "Window",
  Player = "Player",
  Battle = "Battle",
  Field = "Field",
  Savemap = "Savemap",
  Special = "Special",
  Temp = "Temp",
}

export enum Mnemonic {
  NOP = "NOP",
  NEG = "NEG",
  NOT = "NOT",
  DIST_POINT = "DIST_POINT",
  DIST_MODEL = "DIST_MODEL",
  DIR_POINT = "DIR_POINT",
  MUL = "MUL",
  ADD = "ADD",
  SUB = "SUB",
  SHL = "SHL",
  SHR = "SHR",
  LT = "LT",
  GT = "GT",
  LE = "LE",
  GE = "GE",
  EQ = "EQ",
  AND = "AND",
  OR = "OR",
  LAND = "LAND",
  LOR = "LOR",
  WRITE = "WRITE",
  RESET = "RESET",
  PUSH_CONSTANT = "PUSH_CONSTANT",
  PUSH_SAVEMAP_BIT = "PUSH_SAVEMAP_BIT",
  PUSH_SPECIAL_BIT = "PUSH_SPECIAL_BIT",
  PUSH_SAVEMAP_BYTE = "PUSH_SAVEMAP_BYTE",
  PUSH_TEMP_BYTE = "PUSH_TEMP_BYTE",
  PUSH_SPECIAL_BYTE = "PUSH_SPECIAL_BYTE",
  PUSH_SAVEMAP_WORD = "PUSH_SAVEMAP_WORD",
  PUSH_TEMP_WORD = "PUSH_TEMP_WORD",
  PUSH_SPECIAL_WORD = "PUSH_SPECIAL_WORD",
  GOTO = "GOTO",
  GOTO_IF_FALSE = "GOTO_IF_FALSE",
  RETURN = "RETURN",
  CALL_FN_ = "CALL_FN_",
  LOAD_MODEL = "LOAD_MODEL",
  SET_PLAYER = "SET_PLAYER",
  SET_SPEED = "SET_SPEED",
  SET_DIR = "SET_DIR",
  WAIT_FRAMES = "WAIT_FRAMES",
  WAIT = "WAIT",
  SET_CONTROLS = "SET_CONTROLS",
  SET_MESH_POS = "SET_MESH_POS",
  SET_LOCAL_POS = "SET_LOCAL_POS",
  SET_VERT_SPEED = "SET_VERT_SPEED",
  SET_Y_OFFSET = "SET_Y_OFFSET",
  ENTER_VEHICLE = "ENTER_VEHICLE",
  STOP = "STOP",
  PLAY_ANIM = "PLAY_ANIM",
  SET_POINT = "SET_POINT",
  SET_POINT_MESH = "SET_POINT_MESH",
  SET_POINT_LOCAL = "SET_POINT_LOCAL",
  SET_TERRAIN_COLOR = "SET_TERRAIN_COLOR",
  SET_LIGHT_DROPOFF = "SET_LIGHT_DROPOFF",
  SET_SKY_TOP = "SET_SKY_TOP",
  SET_SKY_BOTTOM = "SET_SKY_BOTTOM",
  BATTLE = "BATTLE",
  ENTER_FIELD = "ENTER_FIELD",
  SET_MAP_OPTIONS = "SET_MAP_OPTIONS",
  SET_CAM_LOCK = "SET_CAM_LOCK",
  PLAY_SFX = "PLAY_SFX",
  SET_CAM_SPEED = "SET_CAM_SPEED",
  RESET_ZOLOM = "RESET_ZOLOM",
  FACE_POINT = "FACE_POINT",
  SET_WINDOW_SIZE = "SET_WINDOW_SIZE",
  SET_MESSAGE = "SET_MESSAGE",
  SET_PROMPT = "SET_PROMPT",
  WAIT_PROMPT = "WAIT_PROMPT",
  SET_MOVE_DIR = "SET_MOVE_DIR",
  SET_CAM_TILT = "SET_CAM_TILT",
  SET_CAM_ZOOM = "SET_CAM_ZOOM",
  SET_ENCOUNTERS = "SET_ENCOUNTERS",
  SET_WINDOW_STYLE = "SET_WINDOW_STYLE",
  WAIT_WINDOW = "WAIT_WINDOW",
  WAIT_DISMISS = "WAIT_DISMISS",
  SET_PLAYER_DIR = "SET_PLAYER_DIR",
  SET_ENTITY = "SET_ENTITY",
  EXIT_VEHICLE = "EXIT_VEHICLE",
  CHOCOBO_RUN = "CHOCOBO_RUN",
  FACE_MODEL = "FACE_MODEL",
  WAIT_FUNC = "WAIT_FUNC",
  SET_WALK_SPEED = "SET_WALK_SPEED",
  HIDE_MODEL = "HIDE_MODEL",
  SET_VERT_SPEED2 = "SET_VERT_SPEED2",
  FADE_OUT = "FADE_OUT",
  SET_FIELD_ENTRY = "SET_FIELD_ENTRY",
  SET_FIELD_ENTRY_ID = "SET_FIELD_ENTRY_ID",
  PLAY_MUSIC = "PLAY_MUSIC",
  MOVE_TO_MODEL = "MOVE_TO_MODEL",
  FADE_IN = "FADE_IN",
  SET_PROGRESS = "SET_PROGRESS",
  PLAY_LAYER_ANIM = "PLAY_LAYER_ANIM",
  SET_CHOCOBO = "SET_CHOCOBO",
  SET_SUBMARINE = "SET_SUBMARINE",
  SHOW_LAYER = "SHOW_LAYER",
  HIDE_LAYER = "HIDE_LAYER",
  SET_Y_POS = "SET_Y_POS",
  SHOW_METEOR = "SHOW_METEOR",
  SET_MUSIC_VOL = "SET_MUSIC_VOL",
  SHAKE_CAM = "SHAKE_CAM",
  ADJUST_POS = "ADJUST_POS",
  SET_VEHICLE_USABLE = "SET_VEHICLE_USABLE",
  SET_BATTLE_TIMER = "SET_BATTLE_TIMER",
}

export const Opcodes: Record<number, OpcodeDefinition> = {
  0x00: {
    name: "noop",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.NOP,
    namespace: Namespace.System,
    description: "No operation",
  },
  0x15: {
    name: "negate",
    stackParams: 1,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.NEG,
    namespace: Namespace.Math,
    description: "Negate value on stack",
  },
  0x17: {
    name: "not",
    stackParams: 1,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.NOT,
    namespace: Namespace.Math,
    description: "Logical NOT of value on stack",
  },
  0x18: {
    name: "distance_to_point",
    stackParams: 1,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.DIST_POINT,
    namespace: Namespace.Entity,
    description: "Get distance from active entity to a point",
  },
  0x19: {
    name: "distance_to_entity",
    stackParams: 1,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.DIST_MODEL,
    namespace: Namespace.Entity,
    description: "Get distance from active entity to another",
  },
  0x1b: {
    name: "direction_to_point",
    stackParams: 1,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.DIR_POINT,
    namespace: Namespace.Entity,
    description: "Get direction from active entity to a point",
  },
  0x30: {
    name: "multiply",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.MUL,
    namespace: Namespace.Math,
    description: "Multiply two values on stack",
  },
  0x40: {
    name: "add",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.ADD,
    namespace: Namespace.Math,
    description: "Add two values on stack",
  },
  0x41: {
    name: "subtract",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.SUB,
    namespace: Namespace.Math,
    description: "Subtract two values on stack",
  },
  0x50: {
    name: "shift_left",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.SHL,
    namespace: Namespace.Math,
    description: "Shift left",
  },
  0x51: {
    name: "shift_right",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.SHR,
    namespace: Namespace.Math,
    description: "Shift right",
  },
  0x60: {
    name: "less_than",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.LT,
    namespace: Namespace.Math,
    description: "Less than comparison",
  },
  0x61: {
    name: "greater_than",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.GT,
    namespace: Namespace.Math,
    description: "Greater than comparison",
  },
  0x62: {
    name: "less_equal",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.LE,
    namespace: Namespace.Math,
    description: "Less than or equal comparison",
  },
  0x63: {
    name: "greater_equal",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.GE,
    namespace: Namespace.Math,
    description: "Greater than or equal comparison",
  },
  0x70: {
    name: "equal",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.EQ,
    namespace: Namespace.Math,
    description: "Equal comparison",
  },
  0x80: {
    name: "bitwise_and",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.AND,
    namespace: Namespace.Math,
    description: "Bitwise AND",
  },
  0xa0: {
    name: "bitwise_or",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.OR,
    namespace: Namespace.Math,
    description: "Bitwise OR",
  },
  0xb0: {
    name: "logical_and",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.LAND,
    namespace: Namespace.Math,
    description: "Logical AND",
  },
  0xc0: {
    name: "logical_or",
    stackParams: 2,
    codeParams: 0,
    pushesResult: true,
    mnemonic: Mnemonic.LOR,
    namespace: Namespace.Math,
    description: "Logical OR",
  },
  0xe0: {
    name: "write_bank",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.WRITE,
    namespace: Namespace.Memory,
    description: "Write a value to a memory bank",
  },

  0x100: {
    name: "reset_stack",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.RESET,
    namespace: Namespace.System,
    description: "Reset the stack",
  },
  0x110: {
    name: "push_constant",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_CONSTANT,
    namespace: Namespace.Memory,
    description: "Push a constant value onto the stack",
  },
  0x114: {
    name: "bit",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_SAVEMAP_BIT,
    namespace: Namespace.Savemap,
    description: "Read a bit from Bank 0",
  },
  0x117: {
    name: "bit",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_SPECIAL_BIT,
    namespace: Namespace.Special,
    description: "Read a bit from the special register",
  },
  0x118: {
    name: "byte",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_SAVEMAP_BYTE,
    namespace: Namespace.Savemap,
    description: "Read a byte from Bank 0",
  },
  0x119: {
    name: "byte",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_TEMP_BYTE,
    namespace: Namespace.Temp,
    description: "Read a byte from Bank 1",
  },
  0x11b: {
    name: "byte",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_SPECIAL_BYTE,
    namespace: Namespace.Special,
    description: "Read a byte from the special register",
  },
  0x11c: {
    name: "word",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_SAVEMAP_WORD,
    namespace: Namespace.Savemap,
    description: "Read a word (2 bytes) from Bank 0",
  },
  0x11d: {
    name: "word",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_TEMP_WORD,
    namespace: Namespace.Temp,
    description: "Read a word (2 bytes) from Bank 1",
  },
  0x11f: {
    name: "word",
    stackParams: 0,
    codeParams: 1,
    pushesResult: true,
    mnemonic: Mnemonic.PUSH_SPECIAL_WORD,
    namespace: Namespace.Special,
    description: "Read a word (2 bytes) from the special register",
  },

  0x200: {
    name: "goto",
    stackParams: 0,
    codeParams: 1,
    mnemonic: Mnemonic.GOTO,
    namespace: Namespace.System,
    description: "Unconditional jump to another location in code",
  },
  0x201: {
    name: "goto_if_false",
    stackParams: 1,
    codeParams: 1,
    mnemonic: Mnemonic.GOTO_IF_FALSE,
    namespace: Namespace.System,
    description: "Conditional branch to another location in code if the condition result on the stack is false",
  },
  0x203: {
    name: "return",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.RETURN,
    namespace: Namespace.System,
    description: "Return from a function call",
  },
  0x204: {
    name: "call_function",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.CALL_FN_,
    namespace: Namespace.System,
    description: "Call another script function by ID",
  },

  0x300: {
    name: "load_model",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.LOAD_MODEL,
    namespace: Namespace.Entity,
    description: "Load a model for an entity",
  },
  0x302: {
    name: "set_player_model",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.SET_PLAYER,
    namespace: Namespace.Entity,
    description: "Set the player's entity model",
  },
  0x303: {
    name: "set_movespeed",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_SPEED,
    namespace: Namespace.Entity,
    description: "Set the active entity's movement speed",
  },
  0x304: {
    name: "set_direction_facing",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_DIR,
    namespace: Namespace.Entity,
    description: "Set direction and facing",
  },
  0x305: {
    name: "wait_frames",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.WAIT_FRAMES,
    pushesResult: true,
    namespace: Namespace.System,
    description: "Wait for a specified number of frames",
  },
  0x306: {
    name: "wait",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.WAIT,
    namespace: Namespace.System,
    description: "Wait for the next frame",
  },
  0x307: {
    name: "set_control_lock",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_CONTROLS,
    namespace: Namespace.System,
    description: "Lock/unlock player controls",
  },
  0x308: {
    name: "set_mesh_coords",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.SET_MESH_POS,
    namespace: Namespace.Entity,
    description: "Set active entity's mesh coordinates",
  },
  0x309: {
    name: "set_coords_in_mesh",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.SET_LOCAL_POS,
    namespace: Namespace.Entity,
    description: "Set active entity's coordinates within mesh",
  },
  0x30a: {
    name: "set_vertical_speed",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_VERT_SPEED,
    namespace: Namespace.Entity,
    description: "Set active entity's vertical speed",
  },
  0x30b: {
    name: "set_y_offset",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_Y_OFFSET,
    namespace: Namespace.Entity,
    description: "Set active entity's Y offset",
  },
  0x30c: {
    name: "enter_vehicle",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.ENTER_VEHICLE,
    namespace: Namespace.Entity,
    description: "Make active entity enter a vehicle",
  },
  0x30d: {
    name: "stop",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.STOP,
    namespace: Namespace.Entity,
    description: "Stop the active entity's movement",
  },
  0x30e: {
    name: "play_animation",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.PLAY_ANIM,
    namespace: Namespace.Entity,
    description: "Play an animation on the active entity",
  },
  0x310: {
    name: "set_active",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.SET_POINT,
    namespace: Namespace.Point,
    description: "Set the active point",
  },
  0x311: {
    name: "set_mesh_coords",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.SET_POINT_MESH,
    namespace: Namespace.Point,
    description: "Set point mesh coordinates",
  },
  0x312: {
    name: "set_coords_in_mesh",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.SET_POINT_LOCAL,
    namespace: Namespace.Point,
    description: "Set point coordinates within mesh",
  },
  0x313: {
    name: "set_terrain_color",
    stackParams: 3,
    codeParams: 0,
    mnemonic: Mnemonic.SET_TERRAIN_COLOR,
    namespace: Namespace.Point,
    description: "Set the terrain color at a point",
  },
  0x314: {
    name: "set_dropoff_params",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.SET_LIGHT_DROPOFF,
    namespace: Namespace.Point,
    description: "Configure dropoff parameters for a point",
  },
  0x315: {
    name: "set_sky_top_color",
    stackParams: 3,
    codeParams: 0,
    mnemonic: Mnemonic.SET_SKY_TOP,
    namespace: Namespace.Point,
    description: "Set the top color of the sky",
  },
  0x316: {
    name: "set_sky_bottom_color",
    stackParams: 3,
    codeParams: 0,
    mnemonic: Mnemonic.SET_SKY_BOTTOM,
    namespace: Namespace.Point,
    description: "Set the bottom color of the sky",
  },
  0x317: {
    name: "trigger_battle",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.BATTLE,
    namespace: Namespace.System,
    description: "Trigger a battle by ID",
  },
  0x318: {
    name: "enter_field",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.ENTER_FIELD,
    namespace: Namespace.System,
    description: "Transition to a field scene",
  },
  0x319: {
    name: "set_map_options",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_MAP_OPTIONS,
    namespace: Namespace.System,
    description: "Configure map-wide settings",
  },
  0x31b: {
    name: "noop",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.NOP,
    namespace: Namespace.System,
    description: "No operation (placeholder)",
  },
  0x31c: {
    name: "set_tilt_zoom_status",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_CAM_LOCK,
    namespace: Namespace.Camera,
    description: "Set camera tilt/zoom state",
  },
  0x31d: {
    name: "play_sfx",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.PLAY_SFX,
    namespace: Namespace.Sound,
    description: "Play a sound effect by ID",
  },
  0x31f: {
    name: "set_rotation_speed",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_CAM_SPEED,
    namespace: Namespace.Camera,
    description: "Adjust camera rotation speed",
  },
  0x320: {
    name: "reset_zolom",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.RESET_ZOLOM,
    namespace: Namespace.System,
    description: "Reset Midgar Zolom state if disabled",
  },
  0x321: {
    name: "face_point",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.FACE_POINT,
    namespace: Namespace.Entity,
    description: "Make active entity face a point",
  },
  0x324: {
    name: "set_dimensions",
    stackParams: 4,
    codeParams: 0,
    mnemonic: Mnemonic.SET_WINDOW_SIZE,
    namespace: Namespace.Window,
    description: "Set window position and size",
  },
  0x325: {
    name: "set_message",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_MESSAGE,
    namespace: Namespace.Window,
    description: "Set the window's message text by ID",
  },
  0x326: {
    name: "set_prompt",
    stackParams: 3,
    codeParams: 0,
    mnemonic: Mnemonic.SET_PROMPT,
    namespace: Namespace.Window,
    description: "Set a prompt in the window",
  },
  0x327: {
    name: "wait_for_prompt_ack",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.WAIT_PROMPT,
    namespace: Namespace.Window,
    description: "Wait for the player to acknowledge a prompt",
  },
  0x328: {
    name: "set_movement_direction",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_MOVE_DIR,
    namespace: Namespace.Entity,
    description: "Set entity movement direction",
  },
  0x329: {
    name: "set_tilt_speed",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_CAM_TILT,
    namespace: Namespace.Camera,
    description: "Adjust camera tilt speed",
  },
  0x32a: {
    name: "set_zoom_speed",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_CAM_ZOOM,
    namespace: Namespace.Camera,
    description: "Adjust camera zoom speed",
  },
  0x32b: {
    name: "set_encounters",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_ENCOUNTERS,
    namespace: Namespace.System,
    description: "Enable/disable random encounters",
  },
  0x32c: {
    name: "set_params",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.SET_WINDOW_STYLE,
    namespace: Namespace.Window,
    description: "Configure window style and behavior",
  },
  0x32d: {
    name: "wait_until_ready",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.WAIT_WINDOW,
    namespace: Namespace.Window,
    description: "Wait until the window is ready",
  },
  0x32e: {
    name: "wait_for_acknowledge",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.WAIT_DISMISS,
    namespace: Namespace.Window,
    description: "Wait for the player to dismiss the window",
  },
  0x32f: {
    name: "set_direction",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_PLAYER_DIR,
    namespace: Namespace.Player,
    description: "Set the player's facing direction",
  },
  0x330: {
    name: "set_active_entity",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_ENTITY,
    namespace: Namespace.Player,
    description: "Set the active entity (e.g., player)",
  },
  0x331: {
    name: "exit_vehicle",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.EXIT_VEHICLE,
    namespace: Namespace.Player,
    description: "Make the player exit a vehicle",
  },
  0x332: {
    name: "chocobo_run_away",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.CHOCOBO_RUN,
    namespace: Namespace.Player,
    description: "Trigger chocobo runaway behavior",
  },
  0x333: {
    name: "rotate_to_model",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.FACE_MODEL,
    namespace: Namespace.Entity,
    description: "Rotate active entity to face a model",
  },
  0x334: {
    name: "wait_for_function",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.WAIT_FUNC,
    namespace: Namespace.System,
    description: "Wait until a function completes",
  },
  0x336: {
    name: "set_walk_speed",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_WALK_SPEED,
    namespace: Namespace.Entity,
    description: "Set entity walking speed",
  },
  0x339: {
    name: "hide_model",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.HIDE_MODEL,
    namespace: Namespace.Entity,
    description: "Hide the active entity's model",
  },
  0x33a: {
    name: "set_vertical_speed_2",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_VERT_SPEED2,
    namespace: Namespace.Entity,
    description: "Set an alternate vertical speed",
  },
  0x33b: {
    name: "fade_out",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.FADE_OUT,
    namespace: Namespace.System,
    description: "Fade the screen to black",
  },
  0x33c: {
    name: "set_field_entry",
    stackParams: 0,
    codeParams: 0,
    mnemonic: Mnemonic.SET_FIELD_ENTRY,
    namespace: Namespace.System,
    description: "Set field scene entry point",
  },
  0x33d: {
    name: "set_field_entry_by_id",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_FIELD_ENTRY_ID,
    namespace: Namespace.System,
    description: "Set field entry point by ID",
  },
  0x33e: {
    name: "play_music",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.PLAY_MUSIC,
    namespace: Namespace.Sound,
    description: "Play a music track by ID",
  },
  0x347: {
    name: "move_to_entity",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.MOVE_TO_MODEL,
    namespace: Namespace.Entity,
    description: "Move active entity to another entity",
  },
  0x348: {
    name: "fade_in",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.FADE_IN,
    namespace: Namespace.System,
    description: "Fade the screen from black",
  },
  0x349: {
    name: "set_world_progress",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_PROGRESS,
    namespace: Namespace.System,
    description: "Update the game's progress flags",
  },
  0x34a: {
    name: "play_layer_animation",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.PLAY_LAYER_ANIM,
    namespace: Namespace.System,
    description: "Play an animation on a layer",
  },
  0x34b: {
    name: "set_chocobo_type",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_CHOCOBO,
    namespace: Namespace.Player,
    description: "Set the player's chocobo type",
  },
  0x34c: {
    name: "set_submarine_color",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_SUBMARINE,
    namespace: Namespace.Player,
    description: "Set the submarine's color",
  },
  0x34d: {
    name: "show_layer",
    stackParams: 3,
    codeParams: 0,
    mnemonic: Mnemonic.SHOW_LAYER,
    namespace: Namespace.System,
    description: "Show an animation layer",
  },
  0x34e: {
    name: "hide_layer",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.HIDE_LAYER,
    namespace: Namespace.System,
    description: "Hide an animation layer",
  },
  0x34f: {
    name: "set_y_position",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_Y_POS,
    namespace: Namespace.Entity,
    description: "Set active entity's Y position",
  },
  0x350: {
    name: "show_meteor",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SHOW_METEOR,
    namespace: Namespace.System,
    description: "Show/hide the meteor in the sky",
  },
  0x351: {
    name: "set_music_volume",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_MUSIC_VOL,
    namespace: Namespace.Sound,
    description: "Adjust the music volume",
  },
  0x352: {
    name: "shake",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SHAKE_CAM,
    namespace: Namespace.Camera,
    description: "Enable/disable camera shaking",
  },
  0x353: {
    name: "adjust_position_outside_vehicle",
    stackParams: 2,
    codeParams: 0,
    mnemonic: Mnemonic.ADJUST_POS,
    namespace: Namespace.Entity,
    description: "Adjust position after exiting vehicle",
  },
  0x354: {
    name: "set_vehicle_usable",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_VEHICLE_USABLE,
    namespace: Namespace.System,
    description: "Enable/disable vehicle usage",
  },
  0x355: {
    name: "set_battle_timer",
    stackParams: 1,
    codeParams: 0,
    mnemonic: Mnemonic.SET_BATTLE_TIMER,
    namespace: Namespace.System,
    description: "Set the battle timer value",
  },
};
