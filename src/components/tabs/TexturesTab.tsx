import { useMapState } from "@/hooks/useMapState"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { useEffect, useMemo, useState } from "react"
import { useAppState } from "@/hooks/useAppState"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { MapType } from "@/hooks/useMapState"

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
    const [mapType, setMapType] = useState<MapType>("overworld")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function load() {
            if (!opened) return
            setIsLoading(true)
            try {
                await loadTextures(mapType)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [opened, openedTime, mapType])

    const textureImages = useMemo(() => {
        if (isLoading) return []
        return textures.map(texture => {
            if (!texture.tex) return null
            console.log(`[Textures] Creating image for ${texture.name}`, texture)
            return {
                ...texture,
                imageData: createImageFromTexture(
                    texture.tex.getPixels(),
                    texture.tex.data.width,
                    texture.tex.data.height
                )
            }
        })
    }, [textures, isLoading])

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="w-1/2 text-lg font-semibold">World Map Textures</h2>
                    <Select value={mapType} onValueChange={(value: MapType) => setMapType(value)}>
                            <SelectTrigger id="map-type" className="w-1/2 h-8">
                                <SelectValue placeholder="Select map type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="overworld">Overworld</SelectItem>
                                <SelectItem value="underwater">Underwater</SelectItem>
                                <SelectItem value="glacier">Great Glacier</SelectItem>
                            </SelectContent>
                        </Select>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-muted-foreground">
                        Loading textures...
                    </div>
                ) : (
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
                                            width: texture.tex.data.width * 2,
                                            height: texture.tex.data.height * 2
                                        }}
                                    />

                                    <div className="text-xs">
                                        <div className="font-medium">{texture.name} ({texture.id})</div>
                                        <div className="text-muted-foreground">
                                            {texture.tex.data.width}x{texture.tex.data.height}
                                        </div>
                                        <div className="text-muted-foreground">
                                            UV: {texture.uOffset},{texture.vOffset}
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </ScrollArea>
    )
} 