/** @jsxImportSource @octane-xplat/jsx/dom */
// Copyright (c) Meta Platforms, Inc. and affiliates.
import { VStack, HStack, Stack, StackItem, Layout, LayoutHeader, LayoutContent, LayoutFooter, Card, Button, Text, Heading, Divider, Switch, CheckboxInput, TextInput, Slider, Selector, DropdownMenu, Popover, HoverCard, Tooltip, Dialog, TabList, Tab, List, ListItem, Spinner, Skeleton, ProgressBar, StatusDot } from '@octane-xplat/ui'
import {useRef, useState} from 'octane';
import { cx } from '../../cx'
// Copyright (c) Meta Platforms, Inc. and affiliates.




// =============================================================================
// Styles — width constraints + reduced motion demo primitive
// =============================================================================



// =============================================================================
// Navigation & Overlays
// =============================================================================

function NavigationOverlaysCard() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card>
        <VStack gap={4}>
          <Text type="label" style={{display: "block"}}>
            Navigation & Overlays
          </Text>
          <VStack gap={2}>
            <Text type="supporting" color="secondary" style={{display: "block"}}>
              Modal — backdrop fade and content entry · duration-medium-max
            </Text>
            <HStack gap={2}>
              <Button
                label="Open modal"
                clickAction={() => setModalOpen(true)}
              />
            </HStack>
          </VStack>
        </VStack>
      </Card>
      <Dialog isOpen={modalOpen} onOpenChange={setModalOpen} width={420}>
        <Layout
          header={
            <LayoutHeader hasDivider padding={4}>
              <Heading level={3}>Confirm action</Heading>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <Text type="body" color="secondary">
                The dialog uses the active theme&apos;s motion tokens for entry
                and dismiss. Backdrop and content animate together.
              </Text>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider padding={4}>
              <HStack gap={2}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  clickAction={() => setModalOpen(false)}
                />
                <Button
                  label="Confirm"
                  variant="primary"
                  clickAction={() => setModalOpen(false)}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>
    </>
  );
}

// =============================================================================
// Micro-Interactions
// =============================================================================

function PopoverDemoContent() {
  return (
    <Card variant="transparent" padding={3} maxWidth={220}>
      <VStack gap={1}>
        <Text type="label">Popover</Text>
        <Text type="supporting" color="secondary">
          Uses duration-fast-max. Fades and translates toward the trigger.
        </Text>
      </VStack>
    </Card>
  );
}

function HoverCardDemoContent() {
  return (
    <Card variant="transparent" padding={3} maxWidth={220}>
      <VStack gap={1}>
        <Text type="label">HoverCard</Text>
        <Text type="supporting" color="secondary">
          Hover to trigger · duration-fast-max
        </Text>
      </VStack>
    </Card>
  );
}

function MicroInteractionsCard() {
  const [switch1, setSwitch1] = useState(false);
  const [switch2, setSwitch2] = useState(true);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(true);
  const [check3, setCheck3] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [selectorValue, setSelectorValue] = useState('Apple');
  const [emailValue, setEmailValue] = useState('ted@example.com');
  const [showStatus, setShowStatus] = useState(false);

  return (
    <Card>
      <VStack gap={4}>
        <Text type="label" style={{display: "block"}}>
          Micro-Interactions
        </Text>

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Buttons — hover, press, focus · duration-fast · Dropdown ·
            duration-fast-max
          </Text>
          <HStack gap={2} wrap="wrap">
            <Button label="Primary" variant="primary" clickAction={() => {}} />
            <Button
              label="Secondary"
              variant="secondary"
              clickAction={() => {}}
            />
            <Button label="Ghost" variant="ghost" clickAction={() => {}} />
            <Button
              label="Destructive"
              variant="destructive"
              clickAction={() => {}}
            />
            <DropdownMenu
              button={{label: 'Dropdown', variant: 'secondary'}}
              items={[
                { type: "action" as const, key: "Edit", label: "Edit", onSelect: () => {} },
                { type: "action" as const, key: "Duplicate", label: "Duplicate", onSelect: () => {} },
                {type: 'separator', key: 'sep'},
                { type: "action" as const, key: "Delete", label: "Delete", onSelect: () => {} },
              ]}
            />
          </HStack>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Popover · HoverCard · Tooltip — fade + translate · duration-fast-max
            · direction-aware
          </Text>
          <HStack gap={2} vAlign="center" wrap="wrap">
            <DemoPopover placement="bottom" label="Below" content={<PopoverDemoContent />} />
            <DemoPopover placement="top" label="Above" content={<PopoverDemoContent />} />
            <DemoPopover placement="right" label="End" content={<PopoverDemoContent />} />
            <DemoPopover placement="left" label="Start" content={<PopoverDemoContent />} />
            <HoverCard content={<HoverCardDemoContent />} placement="below">
              <Button label="HoverCard" variant="secondary" size="sm" />
            </HoverCard>
            <Tooltip content={""} trigger={<Button label="Tooltip" variant="secondary" size="sm" />} />
          </HStack>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Switches — thumb slide, track color · duration-fast
          </Text>
          <HStack gap={4}>
            <Switch
              label="Notifications"
              value={switch1}
              onChange={(v) => setSwitch1(v as any)}
            />
            <Switch label="Sync" value={switch2} onChange={(v) => setSwitch2(v as any)} />
          </HStack>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Checkboxes — check transition · duration-fast
          </Text>
          <HStack gap={6}>
            <CheckboxInput
              label="Option A"
              value={check1}
              onChange={(v) => setCheck1(v as any)}
            />
            <CheckboxInput
              label="Option B"
              value={check2}
              onChange={(v) => setCheck2(v as any)}
            />
            <CheckboxInput
              label="Option C"
              value={check3}
              onChange={(v) => setCheck3(v as any)}
            />
          </HStack>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Slider — thumb travel · duration-fast · value tooltip ·
            duration-fast-min
          </Text>
          <Slider
            label="Volume"
            value={sliderValue}
            onValueChange={(v) => setSliderValue(v as any)}
            min={0}
            max={100}
            className={'ml-maxW300'}
          />
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Input validation — status message entry · duration-fast-max
          </Text>
          <HStack gap={3} vAlign="end">
            <StackItem size="fill" className={'ml-textInputItem'}>
              <TextInput
                label="Email"
                value={emailValue}
                onChange={(v) => setEmailValue(v as any)}
                placeholder="Enter email..."
                status={
                  showStatus
                    ? {type: 'success', message: 'Email verified'}
                    : undefined
                }
              />
            </StackItem>
            <Button
              label={showStatus ? 'Clear' : 'Validate'}
              variant={showStatus ? 'ghost' : 'secondary'}
              clickAction={() => setShowStatus(v => !v)}
            />
          </HStack>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Selector — open/close, chevron rotation · duration-fast-max
          </Text>
          <Selector
            label="Fruit"
            options={[{value: 'Apple', label: 'Apple'}, {value: 'Banana', label: 'Banana'}, {value: 'Orange', label: 'Orange'}, {value: 'Mango', label: 'Mango'}]}
            value={selectorValue}
            onValueChange={(v) => setSelectorValue(v as any)}
            className={'ml-maxW220'}
          />
        </VStack>
      </VStack>
    </Card>
  );
}

// =============================================================================
// Loading & Status
// =============================================================================

function LoadingStatusCard() {
  const [progressValue, setProgressValue] = useState(65);

  return (
    <Card>
      <VStack gap={4}>
        <Text type="label" style={{display: "block"}}>
          Loading & Status
        </Text>

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Spinners — continuous rotation · duration-medium-max
          </Text>
          <HStack gap={4} vAlign="center">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </HStack>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Skeletons — pulsing opacity with stagger · duration-medium-max
          </Text>
          <VStack gap={2}>
            <HStack gap={3} vAlign="center">
              <Skeleton width={40} height={40} radius="rounded" index={0} />
              <StackItem size="fill">
                <VStack gap={1}>
                  <Skeleton width={160} height={14} index={1} />
                  <Skeleton width={100} height={10} index={2} />
                </VStack>
              </StackItem>
            </HStack>
            <Skeleton width="100%" height={12} index={3} />
            <Skeleton width="80%" height={12} index={4} />
            <Skeleton width="60%" height={12} index={5} />
          </VStack>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Progress — determinate: duration-medium · indeterminate: continuous
          </Text>
          <VStack gap={3}>
            <ProgressBar value={progressValue} label={`${progressValue}%`} />
            <HStack gap={2}>
              {[0, 25, 50, 75, 100].map(v => (
                <Button
                  key={v}
                  label={`${v}%`}
                  variant="ghost"
                  size="sm"
                  clickAction={() => setProgressValue(v)}
                />
              ))}
            </HStack>
          </VStack>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Status dots — continuous pulse · 2s loop
          </Text>
          <HStack gap={4} vAlign="center">
            <HStack gap={2} vAlign="center">
              <StatusDot variant="success" label="Online" isPulsing />
              <Text type="body">Online</Text>
            </HStack>
            <HStack gap={2} vAlign="center">
              <StatusDot variant="warning" label="Away" isPulsing />
              <Text type="body">Away</Text>
            </HStack>
            <HStack gap={2} vAlign="center">
              <StatusDot variant="error" label="Busy" isPulsing />
              <Text type="body">Busy</Text>
            </HStack>
          </HStack>
        </VStack>
      </VStack>
    </Card>
  );
}

// =============================================================================
// Surface Interactions
// =============================================================================

function SurfaceInteractionsCard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Card>
      <VStack gap={4}>
        <Text type="label" style={{display: "block"}}>
          Surface Interactions
        </Text>

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            Tabs — color, active indicator · duration-fast
          </Text>
          <TabList value={activeTab} onChange={(v) => setActiveTab(v as any)}>
            <Tab value="overview" label="Overview" />
            <Tab value="analytics" label="Analytics" />
            <Tab value="reports" label="Reports" />
            <Tab value="settings" label="Settings" />
          </TabList>
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>
            List items — background hover · duration-fast-min
          </Text>
          <List density="balanced" hasDividers>
            <ListItem
              label="Dashboard"
              description="View your metrics"
              onPress={() => {}}
            />
            <ListItem
              label="Projects"
              description="Manage active projects"
              onPress={() => {}}
            />
            <ListItem
              label="Settings"
              description="Configure preferences"
              onPress={() => {}}
            />
          </List>
        </VStack>
      </VStack>
    </Card>
  );
}

// =============================================================================
// Reduced Motion
// =============================================================================

function ReducedMotionCard() {
  const [simulateReduced, setSimulateReduced] = useState(false);
  const [moved, setMoved] = useState(false);

  return (
    <Card>
      <VStack gap={4}>
        <Text type="label" style={{display: "block"}}>
          Reduced Motion
        </Text>

        <VStack gap={2}>
          <Text type="supporting" color="secondary" style={{display: "block"}}>

            Honor the OS-level prefers-reduced-motion setting; replace movement
            with instant state changes. Toggle the switch to simulate.
          </Text>
          <VStack gap={3}>
            <Stack className={'ml-ballLane'}>
              <Stack
                className={[
                  'ml-ball',
                  moved && 'ml-ballEnd',
                  simulateReduced && 'ml-ballReduced',
                ]}
              />
            </Stack>
            <HStack gap={3} vAlign="center">
              <Button
                label={moved ? 'Reset' : 'Move'}
                variant="primary"
                size="sm"
                clickAction={() => setMoved(m => !m)}
              />
              <Switch
                label="Simulate reduced motion"
                value={simulateReduced}
                onChange={(v) => setSimulateReduced(v as any)}
              />
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </Card>
  );
}

// =============================================================================
// Page
// =============================================================================

export
function DemoPopover({placement, label, content}: {placement: 'top' | 'bottom' | 'left' | 'right'; label: string; content: any}) {
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button ref={anchorRef as any} label={label} variant="secondary" size="sm" clickAction={() => setOpen(v => !v)} />
      <Popover anchor={anchorRef} open={open} onDismiss={() => setOpen(false)} placement={placement}>
        {content}
      </Popover>
    </>
  )
}

export function MotionExamplesPage() {
  return (
    <VStack gap={6} className={'ml-pageContainer'}>
      <VStack gap={2}>
        <Heading level={1}>Motion Examples</Heading>
        <Text type="body" color="secondary">
          How Astryx components apply duration and easing tokens. Each section
          calls out which tokens drive the motion so you can see the scale in
          action.
        </Text>
      </VStack>

      <VStack gap={4}>
        <NavigationOverlaysCard />
        <MicroInteractionsCard />
        <LoadingStatusCard />
        <SurfaceInteractionsCard />
        <ReducedMotionCard />
      </VStack>
    </VStack>
  );
}
