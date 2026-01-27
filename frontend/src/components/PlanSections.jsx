import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card.jsx"
import Badge from "../components/ui/Badge.jsx"
import ItemRow from "./ItemRow.jsx"
import SectionActions from "./SectionActions.jsx"
import QuickEntry from "./QuickEntry.jsx"
import { ITEM_STATUS } from "../utils/constants.js"

function PlanSections({
  planId,
  sections,
  items,
  collapsedSections,
  onToggleSection,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onQuickAdd,
  onToggleItem,
  onEditItem,
  onUpdateItem,
  onDeleteItem,
  getSectionItems,
  getUnsectionedItems,
}) {
  return (
    <div className="space-y-4">
      {/* Sections */}
      {sections.map((section) => {
        const sectionItems = getSectionItems(section._id)
        const completed = sectionItems.filter(
          (i) => i.status === ITEM_STATUS.COMPLETED
        ).length

        const progress =
          sectionItems.length > 0
            ? Math.round((completed / sectionItems.length) * 100)
            : 0

        return (
          <Card key={section._id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                
                {/* LEFT: toggle + title */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleSection(section._id)}
                    className="cursor-pointer"
                  >
                    {collapsedSections[section._id] ? (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  <CardTitle
                    className="cursor-pointer"
                    onClick={() => onToggleSection(section._id)}
                  >
                    {section.name}
                  </CardTitle>

                  <div className="ml-2 flex items-center gap-2">
                    <Badge variant="secondary">
                      {sectionItems.length} items
                    </Badge>

                    {sectionItems.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary"
                      >
                        {progress}% complete
                      </Badge>
                    )}
                  </div>
                </div>

                {/* RIGHT: actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddItem(null, section._id)
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Item
                  </Button>

                  <SectionActions
                    section={section}
                    onEdit={() => onEditSection(section)}
                    onDelete={() => onDeleteSection(section)}
                  />
                </div>
              </div>
            </CardHeader>

            {!collapsedSections[section._id] && (
              <CardContent>
                {section.description && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {section.description}
                  </p>
                )}

                {sectionItems.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="mb-4 text-muted-foreground">
                      No items in this section
                    </p>
                    <QuickEntry 
                      onAdd={(title) => onQuickAdd(title, section._id)} 
                      placeholder="Add your first item"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sectionItems.map((item) => (
                      <ItemRow
                        key={item._id}
                        item={item}
                        onToggle={() => onToggleItem(item)}
                        onEdit={() => onEditItem(item)}
                        onUpdate={(updates) => onUpdateItem(item, updates)}
                        onDelete={() => onDeleteItem(item)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* Unsectioned Items */}
      {getUnsectionedItems().length > 0 && (
        <Card>
          <CardHeader>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {getUnsectionedItems().map((item) => (
                <ItemRow
                  key={item._id}
                  item={item}
                  onToggle={() => onToggleItem(item)}
                  onEdit={() => onEditItem(item)}
                  onUpdate={(updates) => onUpdateItem(item, updates)}
                  onDelete={() => onDeleteItem(item)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {sections.length === 0 && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Plus className="h-16 w-16 text-muted-foreground/50" />
            <h2 className="mt-4 text-xl font-semibold">
              Get started
            </h2>
            <p className="mt-2 text-muted-foreground">
              Add sections and items to organize your plan
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={onAddSection}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
              <Button
                variant="outline"
                onClick={() => onAddItem(null, null)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PlanSections
