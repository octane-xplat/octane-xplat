// Port of upstream BottomSheet/BottomSheetSwitcherReviewFlow.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { BottomSheet, Button, Heading, HStack, Section, Text, VStack } from '@octane-xplat/ui'

export function BottomSheetSwitcherReviewFlow() @{
  const [activeSheet, setActiveSheet] = useState<string | null>(null)

  return (
    <>
      <Button label="Review settings" onPress={() => setActiveSheet('review')} />
      <BottomSheet
        isOpen={activeSheet === 'review'}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSheet((current) => (current === 'review' ? null : current))
          }
        }}
        label="Review notification settings"
        height="hug"
        purpose="form"
      >
        <Section padding={4}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={3}>Review settings</Heading>
              <Text type="supporting" color="secondary">
                Daily summaries will be sent by email.
              </Text>
            </VStack>
            <HStack gap={2} justify="end">
              <Button label="Cancel" variant="secondary" onPress={() => setActiveSheet(null)} />
              <Button label="Continue" onPress={() => setActiveSheet('confirm')} />
            </HStack>
          </VStack>
        </Section>
      </BottomSheet>
      <BottomSheet
        isOpen={activeSheet === 'confirm'}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSheet((current) => (current === 'confirm' ? null : current))
          }
        }}
        label="Confirm settings"
        height="hug"
      >
        <Section padding={4}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={3}>Confirm settings</Heading>
              <Text type="supporting" color="secondary">
                Your notification settings are ready to save.
              </Text>
            </VStack>
            <HStack gap={2} justify="end">
              <Button label="Back" variant="secondary" onPress={() => setActiveSheet('review')} />
              <Button label="Save" onPress={() => setActiveSheet(null)} />
            </HStack>
          </VStack>
        </Section>
      </BottomSheet>
    </>
  )
}
