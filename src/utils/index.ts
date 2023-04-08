import { createGenerator } from '@unocss/core'
import presetUno from '@unocss/preset-uno'

export type CssType = 'less' | 'scss' | 'css' | 'stylus'

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
        const reg = new RegExp(`${escapeRegExp(code)}(:\\w+)?{(.*)}`)
        const match = css.match(reg)
        if (!match)
          return resolve('')
        const result = match[0].replace(match[2], (match[2] as string).replace(/[:;,]/g, v => `${v} `)).replace('{', ' { ')
        resolve(result)
      })
  })
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\%:\!]/g, '\\\\\\$&')
}
