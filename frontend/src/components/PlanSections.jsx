import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card.jsx"
import Badge from "../components/ui/Badge.jsx"
import ItemRow from "./ItemRow.jsx"
import SectionActions from "./SectionActions.jsx"

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
  onToggleItem,
  onEditItem,
  onDeleteItem,
  getSectionItems,
  getUnsectionedItems
}) {
  return (
    <div className="space-y-4">
      {/* Sections */}
      {sections.map((section) => {
        const sectionItems = getSectionItems(section._id)
        const sectionCompleted = sectionItems.filter(item => item.status === ITEM_STATUS.COMPLETED).length
        const sectionProgress = sectionItems.length > 0 
          ? Math.round((sectionCompleted / sectionItems.length) * 100) 
          : 0

        return (
          <Card key={section._id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2" onClick={() => onToggleSection(section._id)}>
                  <button className="cursor-pointer">
                    {collapsedSections[section._id] ? (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <CardTitle className="cursor-pointer" onClick={() => onToggleSection(section._id)}>
                    {section.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="secondary">
                      {sectionItems.length} items
                    </Badge>
                    {sectionItems.length > 0 && (
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {sectionProgress}% complete
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onAddItem(null, section._id)}>
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
                  <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                )}
                
                {sectionItems.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground mb-4">No items in this section</p>
                    <Button variant="outline" size="sm" onClick={() => onAddItem(null, section._id)}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add your first item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sectionItems.map((item) => (
                      <ItemRow
                        key={item._id}
                        item={item}
                        onToggle={() => onToggleItem(item)}
                        onEdit={() => onEditItem(item)}
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
            <div className="flex items-center justify-between">
              <CardTitle>Unsectioned Items</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onAddItem(null, null)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getUnsectionedItems().map((item) => (
                <ItemRow
                  key={item._id}
                  item={item}
                  onToggle={() => onToggleItem(item)}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {sections.length === 0 && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Plus className="h-16 w-16 text-muted-foreground/50" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">Get started</h2>
            <p className="mt-2 text-muted-foreground">Add sections and items to organize your plan</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={onAddSection}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
              <Button variant="outline" onClick={() => onAddItem(null, null)}>
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