import { createGenerator } from '@unocss/core'
import presetUno from '@unocss/preset-uno'

export type CssType = 'less' | 'scss' | 'css' | 'stylus'

export function transformUnocssBack(code: string): Promise<string> {
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

export const cacheMap = new LRUCache(500)

export function addCache(content: string) {
  const match = content.match(/[\n\s]<template[^>]*>(.*)<\/template>/s)
  if (!match)
    return
  const template = match[1]
  for (const match of template.matchAll(/<[^\s]+\s([^>\/]+)[\/>]/g)) {
    if (!match)
      continue
    // 只考虑单独的属性
    const attributes = match[1].replace(/[\w\-@:]+="[^"]+"/g, '').trim().replace(/\s+/g, ' ')

    if (!attributes)
      continue
      // 过滤缓存已有的属性
    const attrs = attributes.split(' ').filter(attr =>
      !cacheMap.has(attr),
    )
    attrs.forEach(attr =>
      transformUnocssBack(attr).then(r =>
        r && cacheMap.set(attr, r),
      ),
    )
  }
}
