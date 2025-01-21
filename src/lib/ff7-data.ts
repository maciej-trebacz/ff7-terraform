import { exists } from "@tauri-apps/plugin-fs"

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
