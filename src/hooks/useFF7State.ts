"use strict";

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { GameModule, WorldModel } from "./types";

const defaultState = {
    currentModule: 0,
    worldCurrentModel: {} as WorldModel,
    worldModels: [] as WorldModel[],
    zolomCoords: null as [number, number] | null,
    worldMapType: 0,
  };

export const useFF7State = function() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(defaultState);

  useEffect(() => {
    const updateGameState = async () => {
      try {
        const ff7Data: any = await invoke("read_ff7_data");
        const basic: any = ff7Data.basic;

        const worldCurrentModel = ff7Data.world_current_model as WorldModel;
        worldCurrentModel.script = worldCurrentModel.walkmesh_type >> 5;
        worldCurrentModel.walkmesh_type = worldCurrentModel.walkmesh_type & 0x1f;
        
        const worldModels = ff7Data.world_models as WorldModel[];
        
        setGameState(prevState => ({
          ...prevState,
          currentModule: basic.current_module as number,
          worldCurrentModel,
          worldModels,
          zolomCoords: basic.zolom_coords ? [basic.zolom_coords >> 16, basic.zolom_coords & 0xffff] : null,
          worldMapType: basic.world_map_type as number,          
        }));
        setConnected(basic.current_module !== GameModule.None);
      } catch (e) {
        console.warn("Could not read FF7 data: ", e);
        setConnected(false);
      }
    };

    const intervalId = setInterval(updateGameState, 250);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return {
    connected,
    gameState,
  };
};

export type FF7State = typeof defaultState;