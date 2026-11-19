// The actual shared primitive exports used by this fixed-screen fixture, plus
// the useColorScheme scheme hook the starter template reads. Narrowing the
// barrel avoids importing unrelated services; no substitute UI.
export { useColorScheme } from '../../../packages/ui/src/theme/colorScheme.ts'
export { Button } from '../../../packages/ui/src/components/actions/Button.tsrx'
export { Pressable } from '../../../packages/ui/src/components/actions/Pressable.tsrx'
export { Text } from '../../../packages/ui/src/components/content/Text.tsrx'
export { View } from '../../../packages/ui/src/components/layout/View.tsrx'
export { VStack } from '../../../packages/ui/src/components/layout/VStack.tsrx'
export { HStack } from '../../../packages/ui/src/components/layout/HStack.tsrx'
export { SafeArea } from '../../../packages/ui/src/components/layout/SafeArea.tsrx'
export { Screen } from '../../../packages/ui/src/components/layout/Screen.tsrx'
export { ScrollableArea } from '../../../packages/ui/src/components/layout/ScrollableArea.tsrx'
export { ActivityIndicator as Spinner } from '../../../packages/ui/src/components/feedback/ActivityIndicator.tsrx'
export { Icon } from '../../../packages/ui/src/components/media/Icon.tsrx'
export { Image } from '../../../packages/ui/src/components/media/Image.tsrx'
