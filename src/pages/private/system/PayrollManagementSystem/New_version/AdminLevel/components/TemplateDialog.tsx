import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2 } from 'lucide-react'
import type { SalaryTemplate } from '../../types/payroll'

type TemplateDialogProps = {
  open: boolean
  onOpen: () => void
  onClose: () => void
  templateDialogError: string | null
  templateSearchTerm: string
  onTemplateSearchTermChange: (value: string) => void
  filteredTemplates: SalaryTemplate[]
  templatesLoading: boolean
  templateSelection: string | null
  onTemplateSelectionChange: (value: string) => void
  onApplyTemplate: () => void
  isApplyingTemplate: boolean
  currentTemplateIdForRecord: string | null
  selectedEmployeeName: string
}

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onOpen,
  onClose,
  templateDialogError,
  templateSearchTerm,
  onTemplateSearchTermChange,
  filteredTemplates,
  templatesLoading,
  templateSelection,
  onTemplateSelectionChange,
  onApplyTemplate,
  isApplyingTemplate,
  currentTemplateIdForRecord,
  selectedEmployeeName
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        } else if (!open) {
          onOpen()
        }
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Change salary template</DialogTitle>
          <DialogDescription>
            Select a template to re-run calculations for {selectedEmployeeName}.
          </DialogDescription>
        </DialogHeader>

        {templateDialogError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load templates</AlertTitle>
            <AlertDescription>{templateDialogError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="template-search">Search templates</Label>
            <Input
              id="template-search"
              placeholder="Search by name or description"
              value={templateSearchTerm}
              onChange={(event) => onTemplateSearchTermChange(event.target.value)}
            />
          </div>

          <div className="rounded-md border">
            {templatesLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching templates…
              </div>
            ) : filteredTemplates.length ? (
              <ScrollArea className="h-64">
                <RadioGroup
                  value={templateSelection ?? ''}
                  onValueChange={onTemplateSelectionChange}
                  className="divide-y"
                >
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="flex items-start gap-3 p-3">
                      <RadioGroupItem value={template.id} id={`template-${template.id}`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label htmlFor={`template-${template.id}`} className="text-sm font-semibold">
                            {template.name}
                          </Label>
                          {template.isDefault && <Badge variant="secondary">Default</Badge>}
                          {!template.isActive && <Badge variant="destructive">Inactive</Badge>}
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </ScrollArea>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {templateDialogError
                  ? 'Templates could not be loaded. Please retry.'
                  : 'No templates found. Create one in the Salary Template workspace.'}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isApplyingTemplate}>
            Cancel
          </Button>
          <Button
            onClick={onApplyTemplate}
            disabled={
              !templateSelection ||
              templateSelection === currentTemplateIdForRecord ||
              isApplyingTemplate
            }
          >
            {isApplyingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TemplateDialog
