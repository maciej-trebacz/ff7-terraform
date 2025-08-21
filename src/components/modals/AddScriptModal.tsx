import { useState } from "react"
import { Modal } from "@/components/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FunctionType } from "@/ff7/evfile"
import { modelsMapping, modelScriptNames } from "@/ff7/worldscript/constants"

interface AddScriptModalProps {
  isOpen: boolean
  onClose: () => void
  scriptType: FunctionType
  onAddScript: (params: ModelScriptParams | MeshScriptParams) => void
}

interface ModelScriptParams {
  type: "model"
  modelId: number
  functionId: number
}

interface MeshScriptParams {
  type: "mesh"
  x: number
  y: number
  functionId: number
}

export function AddScriptModal({ isOpen, onClose, scriptType, onAddScript }: AddScriptModalProps) {
  const [modelId, setModelId] = useState<string>("")
  const [functionId, setFunctionId] = useState<string>("")
  const [row, setRow] = useState<string>("")
  const [column, setColumn] = useState<string>("")

  const handleSubmit = () => {
    if (scriptType === FunctionType.Model) {
      if (!modelId || !functionId) return
      onAddScript({
        type: "model",
        modelId: parseInt(modelId),
        functionId: parseInt(functionId),
      })
    } else if (scriptType === FunctionType.Mesh) {
      if (!row || !column || !functionId) return
      onAddScript({
        type: "mesh",
        x: parseInt(row),
        y: parseInt(column),
        functionId: parseInt(functionId),
      })
    }

    // Reset form
    setModelId("")
    setFunctionId("")
    setRow("")
    setColumn("")
    onClose()
  }

  const isFormValid = () => {
    if (scriptType === FunctionType.Model) {
      return modelId && functionId
    } else if (scriptType === FunctionType.Mesh) {
      return row && column && functionId
    }
    return false
  }

  const getTitle = () => {
    if (scriptType === FunctionType.Model) {
      return "Add New Model Script"
    } else if (scriptType === FunctionType.Mesh) {
      return "Add New Mesh Script"
    }
    return "Add New Script"
  }

  // Generate model options from modelsMapping
  const modelOptions = Object.entries(modelsMapping)
    .filter(([id]) => id !== "65535") // Exclude system
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => parseInt(a.id) - parseInt(b.id))

  // Generate function options from modelScriptNames
  const functionOptions = Object.entries(modelScriptNames)
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => parseInt(a.id) - parseInt(b.id))

  return (
    <Modal
      open={isOpen}
      setIsOpen={onClose}
      title={getTitle()}
      buttonText="Add Script"
      callback={handleSubmit}
      buttonDisabled={!isFormValid()}
      size="md"
    >
      <div className="space-y-4">
        {scriptType === FunctionType.Model && (
          <>
            <div className="space-y-2">
              <Label htmlFor="model-select" className="text-xs font-medium">
                Model
              </Label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map(({ id, name }) => (
                    <SelectItem key={id} value={id} className="text-xs">
                      {name} (ID: {id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="function-select" className="text-xs font-medium">
                Function
              </Label>
              <Select value={functionId} onValueChange={setFunctionId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select a function" />
                </SelectTrigger>
                <SelectContent>
                  {functionOptions.map(({ id, name }) => (
                    <SelectItem key={id} value={id} className="text-xs">
                      {name} (ID: {id})
                    </SelectItem>
                  ))}
                  {/* Add additional function IDs that might not be in the mapping */}
                  {Array.from({ length: 256 }, (_, i) => i)
                    .filter((i) => !functionOptions.some((opt) => parseInt(opt.id) === i))
                    .map((i) => (
                      <SelectItem key={i} value={i.toString()} className="text-xs">
                        Function {i}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {scriptType === FunctionType.Mesh && (
          <>
            <div className="space-y-2">
              <Label htmlFor="row-select" className="text-xs font-medium">
                Row
              </Label>
              <Select value={row} onValueChange={setRow}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select row" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 36 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-xs">
                      Row {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="column-select" className="text-xs font-medium">
                Column
              </Label>
              <Select value={column} onValueChange={setColumn}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 36 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-xs">
                      Column {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mesh-function-select" className="text-xs font-medium">
                Function ID
              </Label>
              <Select value={functionId} onValueChange={setFunctionId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select function ID" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 16 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-xs">
                      Function {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
