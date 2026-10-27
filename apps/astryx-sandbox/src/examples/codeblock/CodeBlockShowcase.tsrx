// Copyright (c) Meta Platforms, Inc. and affiliates.

import { CodeBlock } from '@octane-xplat/ui'

const code = `import {useState, useEffect} from 'octane';

export function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(\`/api/users/\${id}\`)
      .then(res => res.json())
      .then(setUser);
  }, [id]);

  return user;
}`

export function CodeBlockShowcase() {
	return (
		<CodeBlock code={code} language="typescript" title="useUser.ts" hasLineNumbers hasCopyButton />
	)
}
