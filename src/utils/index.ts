import { createGenerator } from '@unocss/core'
import presetUno from '@unocss/preset-uno'

export type CssType = 'less' | 'scss' | 'css' | 'stylus'
export function getCssType(filename: string) {
  const data = filename.split('.')
  const ext = data.pop()!
  const result = ext === 'styl' ? 'stylus' : ext
  return result as CssType
}

export function transformUnocssBack(code: string) {
  return new Promise((resolve) => {
    createGenerator(
      {},
      {
        presets: [presetUno()],
      },
    )
      .generate(code || '')
      .then((res: any) => {
        const css = res.getLayers()
        const reg = new RegExp(`${code.replace(/[\:\[\]]/g, v => `\\\\${v}`)}{(.*)}`)
        const match = css.match(reg)
        if (!match)
          return
        const result = match[0].replace(match[1], (match[1] as string).replace(/[:;,]/g, v => `${v} `)).replace('{', ' { ')
        resolve(result)
      })
  })
}
