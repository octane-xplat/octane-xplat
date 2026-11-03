/** @jsxImportSource @octane-xplat/jsx */
import { Button, List, ListItem, Text, View } from '@octane-xplat/ui'

/** Public list rows for structural UIA inspection and real input. Commands
 * change props; only the external OS/UIA driver may activate a row. */
export function ListCases(props: {
  revision: number
  disabled: boolean
  onActivate: (source: string, fixtureRevision?: number) => void
}): unknown @{
  <View className="core20-viewport">
    <Button label="Before list" clickAction={() => props.onActivate('list-before')} />
    <List
      id="core20-list"
      accessible
      accessibilityLabel={`Rows ${props.revision}`}
      density={props.revision ? 'compact' : 'balanced'}
      hasDividers
    >
      <ListItem
        id="core20-list-static"
        accessible
        accessibilityLabel={`First row ${props.revision}`}
        label={`First row ${props.revision}`}
        description={`Description ${props.revision}`}
        startContent={<Text id="core20-list-leading">Leading</Text>}
        endContent={<Text id="core20-list-trailing">Trailing</Text>}
      />
      <ListItem
        id="core20-list-item"
        label={`Open row ${props.revision}`}
        isDisabled={props.disabled}
        onPress={() => props.onActivate('list-item', props.revision)}
      />
      <ListItem
        id="core20-list-primitives"
        label={0}
        description={0}
        startContent={0}
        endContent={0}
      >
        {0}
      </ListItem>
    </List>
    <Button label="After list" clickAction={() => props.onActivate('list-after')} />
  </View>
}
