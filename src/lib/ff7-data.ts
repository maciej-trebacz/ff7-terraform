import { exists, readFile, writeFile } from "@tauri-apps/plugin-fs"
import { LGP } from "@/ff7/lgp"
import { MesFile } from "@/ff7/mesfile"
import { invoke } from "@tauri-apps/api/core";

export async function validateFF7Directory(path: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const worldLgpPath = `${path}/data/wm/world_us.lgp`
    const wmMapPath = `${path}/data/wm/WM0.MAP`

    const [hasWorldLgp, hasWmMap] = await Promise.all([
      exists(worldLgpPath),
      exists(wmMapPath)
    ])

    if (!hasWorldLgp || !hasWmMap) {
      return {
        valid: false,
        error: "Selected directory does not contain required FF7 world map files. Please select a valid FF7 game directory."
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: "Failed to validate FF7 directory: " + (error as Error).message
    }
  }
}

export async function openWorldLGP(gamePath: string): Promise<LGP> {
  const worldLgpPath = `${gamePath}/data/wm/world_us.lgp`
  const data = await readFile(worldLgpPath)
  return new LGP(data.buffer)
}

export async function readWorldFile(gamePath: string, filename: string): Promise<Uint8Array | null> {
  try {
    const lgp = await openWorldLGP(gamePath)
    return lgp.getFile(filename)
  } catch (error) {
    console.error("Failed to read world file:", error)
    return null
  }
}

export async function loadMessages(gamePath: string): Promise<string[]> {
  try {
    const mesData = await readWorldFile(gamePath, "mes")
    if (!mesData) {
      console.error("Failed to read mes file")
      return []
    }

    const mesFile = new MesFile(mesData)
    return mesFile.data.messages.map(msg => msg.text)
  } catch (error) {
    console.error("Error loading messages:", error)
    return []
  }
}

export async function saveMessages(gamePath: string, messages: string[]): Promise<void> {
  const lgp = await openWorldLGP(gamePath)
  const mesData = lgp.getFile("mes")
  if (!mesData) {
    throw new Error("Failed to read mes file")
  }

  const mesFile = new MesFile(mesData)
  messages.forEach((text, index) => {
    mesFile.setMessage(index, text)
  })

  const newData = mesFile.writeMessages()
  lgp.setFile("mes", newData)
  
  // Write the updated LGP archive back to disk
  const worldLgpPath = `${gamePath}/data/wm/world_us.lgp`
  const buffer = lgp.writeArchive()
  await writeFile(worldLgpPath, new Uint8Array(buffer))
} 

export async function syncMessages(messages: string[]) {
  const mesFile = new MesFile();
  mesFile.setMessages(messages);
  const data = mesFile.writeMessages();
  await invoke("update_mes_data", { data });
}