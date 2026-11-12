import { describe, it, expect } from 'vitest'
import { buildStaticWorkshop } from '../dist/build/static.js'

describe('static output ownership', () => {
  it.each(['.', 'src', '../other', 'dist/../src'])(
    'refuses unsafe output %s before loading the compiler',
    async (outDir) => {
      await expect(buildStaticWorkshop({ cwd: process.cwd(), outDir })).rejects.toThrow('output')
    },
  )

  it('rejects native targets and malformed bases', async () => {
    await expect(buildStaticWorkshop({ target: 'ios' })).rejects.toThrow('web only')
    await expect(buildStaticWorkshop({ base: '//example.com/' })).rejects.toThrow('base')
  })
})
