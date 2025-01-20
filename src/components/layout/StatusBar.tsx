import { useStatusBar } from "@/hooks/useStatusBar";
import { useAppState } from "@/hooks/useAppState";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { version } from "../../../src-tauri/tauri.conf.json";
import { AboutModal } from "../modals/AboutModal";

export function StatusBar() {
  const { message, isError } = useStatusBar();
  const { connected } = useAppState();
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "h-6 bg-zinc-800 items-center flex px-2 text-xs gap-2 flex-shrink-0"
        )}
      >
        <div className="flex items-center">
          <div
            className={cn(
              connected ? "bg-green-500" : "bg-zinc-500",
              "h-[7px] w-[7px] rounded-full mr-1.5 "
            )}
          ></div>
          Game {connected ? "connected" : "disconnected"}
        </div>
        <div className="h-4 w-px bg-zinc-600"></div>
        <div className={cn(isError ? "text-red-400" : "text-zinc-400")}>
          {message}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* <div 
            className="text-zinc-400 hover:text-zinc-200 cursor-pointer" 
            onClick={() => setIsHelpModalOpen(true)}
          >
            Help
          </div>
          <div className="h-4 w-px bg-zinc-600"></div> */}
          <div
            className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
            onClick={() => setIsAboutModalOpen(true)}
          >
            v{version}
          </div>
        </div>
      </div>
      <AboutModal isOpen={isAboutModalOpen} setIsOpen={setIsAboutModalOpen} />
    </>
  );
}
