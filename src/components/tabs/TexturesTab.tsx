import { useMapState } from "@/hooks/useMapState"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { useEffect, useMemo } from "react"
import { useAppState } from "@/hooks/useAppState"

function createImageFromTexture(pixels: Uint8Array, width: number, height: number): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    const imageData = ctx.createImageData(width, height)
    for (let i = 0; i < pixels.length; i += 4) {
        imageData.data[i] = pixels[i]     // Red (swap with Blue)
        imageData.data[i + 1] = pixels[i + 1] // Green
        imageData.data[i + 2] = pixels[i + 2]     // Blue (swap with Red)
        imageData.data[i + 3] = pixels[i + 3] // Alpha
    }
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
}

export function TexturesTab() {
    const { textures, loadTextures } = useMapState()
    const { opened, openedTime } = useAppState()

    useEffect(() => {
        if (opened) {
            loadTextures()
        }
    }, [opened, openedTime])

    const textureImages = useMemo(() => {
        return textures.map(texture => {
            if (!texture.tex) return null
            console.log(`[Textures] Creating image for ${texture.name}`, texture)
            return {
                ...texture,
                imageData: createImageFromTexture(
                    texture.tex.getPixels(),
                    texture.width,
                    texture.height
                )
            }
        })
    }, [textures])

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
                <h2 className="text-lg font-semibold mb-4">World Map Textures</h2>
                <div className="grid grid-cols-4 gap-4">
                    {textureImages.map(texture => {
                        if (!texture) return null
                        return (
                            <Card key={texture.id} className="p-2 space-y-2">
                                <img
                                    src={texture.imageData}
                                    alt={texture.name}
                                    className="border border-border"
                                    style={{
                                        imageRendering: 'pixelated',
                                        width: texture.width * 2,
                                        height: texture.height * 2
                                    }}
                                />
                                <div className="text-xs">
                                    <div className="font-medium">{texture.name} ({texture.id})</div>
                                    <div className="text-muted-foreground">
                                        {texture.width}x{texture.height}
                                    </div>
                                    <div className="text-muted-foreground">
                                        UV: {texture.uOffset},{texture.vOffset}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </ScrollArea>
    )
} 