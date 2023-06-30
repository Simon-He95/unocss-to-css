import { expect, it } from 'vitest'
import { transformUnocssBack } from '../src/utils'

it('test', async () => {
  // expect(await transformUnocssBack('class="bg-red"')).toMatchInlineSnapshot('""')
  // expect(await transformUnocssBack('p-y-10')).toMatchInlineSnapshot(`
  //   "p-y-10 {
  //     padding-top: 2.5rem;
  //     padding-bottom: 2.5rem;
  //   }"
  // `)
  // expect(await transformUnocssBack('bg-white')).toMatchInlineSnapshot(`
  //   "bg-white {
  //     --un-bg-opacity: 1;
  //     background-color: rgba(255, 255, 255, var(--un-bg-opacity));
  //   }"
  // `)
  expect(await transformUnocssBack('bg-#fff')).toMatchInlineSnapshot('""')

  // expect(await transformUnocssBack('text-dark:gray-200')).toMatchInlineSnapshot(`
  //   "text-dark\\\\:gray-200 {
  //     --un-text-opacity: 1;
  //     color: rgba(34, 34, 34, var(--un-text-opacity));
  //   }"
  // `)
})
