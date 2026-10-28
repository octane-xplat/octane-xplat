/** @jsxImportSource @octane-xplat/jsx/dom */
// Copyright (c) Meta Platforms, Inc. and affiliates.
import { Section, HStack, VStack, Heading, Text } from '@octane-xplat/ui'
import { cx } from '../../cx'
// Copyright (c) Meta Platforms, Inc. and affiliates.


/**
 * @file PageFrame.tsx
 * @input Section metadata
 * @output The heading block every lab page opens with
 * @position Motion Lab shared UI
 */

import type {ReactNode} from 'octane';



export function LabPage({
  title,
  intro,
  decides,
  badges,
  children,
}: {
  title: string;
  intro: string;
  decides?: string;
  badges?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Section padding={6} width="100%">
      <VStack gap={5}>
        <VStack gap={2} className={cx('ml-intro')}>
          <HStack gap={2} vAlign="center" wrap="wrap">
            <Heading level={1}>{title}</Heading>
            {badges}
          </HStack>
          <Text color="secondary">{intro}</Text>
          {decides != null && (
            <Text type="supporting" color="secondary">
              <strong>Decide here: </strong>
              {decides}
            </Text>
          )}
        </VStack>
        {children}
      </VStack>
    </Section>
  );
}
