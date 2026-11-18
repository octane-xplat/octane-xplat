// Type contract only. The target build must select a platform implementation.
import type { StoryDefinition } from '@octane-xplat/workshop'
import type { IsolationFixture, IsolationProps } from './isolation-fixture'

export declare const Isolation: StoryDefinition<IsolationProps, void, IsolationFixture>
