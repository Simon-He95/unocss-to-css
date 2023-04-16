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
        const reg = new RegExp(`${escapeRegExp(code)}([:\\>][\\w\\-\\(\\)]+)?{(.*)}`)
        const match = css.match(reg)
        if (!match)
          return resolve('')
        const result = match[0].replace(match[2], (match[2] as string).replace(/[:,]/g, v => `${v} `)).replace('{', ' {\n  ').replace(/;/g, ';\n  ').replace('  }', '}')
        resolve(result)
      })
  })
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\%:\!\&\>]/g, '\\\\\\$&')
}

export class LRUCache {
  private cache
  private maxSize
  constructor(maxSize: number) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: any) {
    // 获取缓存值，并将其从Map中删除再重新插入，保证其成为最新的元素
    const value = this.cache.get(key)
    if (value !== undefined) {
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: any, value: any) {
    // 如果缓存已满，先删除最旧的元素
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    // 插入新值
    this.cache.set(key, value)
  }

  has(key: any) {
    return this.cache.has(key)
  }
}
