import { createGenerator } from '@unocss/core'
import presetUno from '@unocss/preset-uno'
import * as vscode from 'vscode'

export type CssType = 'less' | 'scss' | 'css' | 'stylus'

const style = {
  dark: Object.assign({
    textDecoration: 'underline dashed #fff',
  }),
  light: Object.assign({
    textDecoration: 'underline dashed #333',
  }),
}
export const decorationType = vscode.window.createTextEditorDecorationType(style)

export function transformUnocssBack(code: string): Promise<string> {
  return new Promise((resolve) => {
    createGenerator(
      {},
      {
        presets: [
          presetUno(),
        ],
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

export const cacheMap = new LRUCache(5000)

export async function addCacheVue(content: string) {
  const match = content.match(/[\n\s]<template[^>]*>(.*)<\/template>/s)
  if (!match)
    return
  const template = match[1]
  const { line } = getPosition(content, match.index!)!
  const realRangeMap = []
  let _attrs: any[] = []
  for (const match of template.matchAll(/<[^\s]+\s([^>\/]+)[\/>]/g)) {
    if (!match)
      continue
    // 只考虑单独的属性
    let attributeStr = match[1].trim().replace(/\s+/g, ' ').replace(/\s(['"])/g, '$1').replace(/="\s/g, '="')
    // class
    const { line: outLine } = getPosition(template, match.index!)!
    const offset = match[0].indexOf(match[1]) + match.index! - 1
    attributeStr = attributeStr.replace(/class="([^"]*)"/, (_, attr, i) => {
      let pos = i + 6
      _attrs.push(...attr.split(' ').map((content: string, index: number) => {
        // pos+=character
        if (index !== 0)
          pos += 1
        return {
          content,
          position: [
            {
              start: offset + pos,
              end: pos + content.length + offset,
              line: line + outLine,
            },
          ],
        }
      }))
      return ''
    })

    attributeStr = attributeStr.replace(/(\w+)="([^"]*)"/g, (_, name, values, i) => {
      if (name === 'style')
        return '_'.repeat(_.length)
      let pos = i + name.length + 2
      _attrs.push(...values.split(' ').map((v: string, index: any) => {
        if (index !== 0)
          pos += 1
        return {
          content: `${name}-${v}`,
          position: i === 0
            ? [
                {
                  start: offset + i,
                  end: offset + i + name.length,
                  line: line + outLine,
                },
                {
                  start: offset + pos,
                  end: offset + pos + v.length,
                  line: line + outLine,
                },
              ]
            : [],
        }
      }))
      return '_'.repeat(_.length)
    })

    attributeStr.split(' ').forEach(async (attr) => {
      if (/_+/.test(attr) || !/\w+/.test(attr) || /(\w+)="([^"]*)/.test(attr))
        return
      const start = attributeStr.indexOf(attr)
      _attrs.push({
        content: attr,
        position: [
          {
            start: offset + start,
            end: offset + start + attr.length,
            line: line + outLine,
          },
        ],
      })
    })

    // todo: 修复初始化的高亮坐标
    // highlight(realRangeMap.map(({ start, end, line }) =>
    //   new vscode.Range(new vscode.Position(line, start), new vscode.Position(line, end))
    // ))
  }
  const _map = new Set()
  // 过滤重复的attr
  _attrs = _attrs.filter(attr => !cacheMap.has(attr.content)).map((attr) => {
    if (_map.has(attr.content))
      return undefined
    _map.add(attr.content)
    return attr
  }).filter(Boolean)

  for (const item of _attrs) {
    const { content, position } = item
    if (cacheMap.has(content)) {
      realRangeMap.push(...position)
      continue
    }
    transformUnocssBack(content).then((transferredCss) => {
      if (transferredCss) {
        cacheMap.set(content, transferredCss)
        realRangeMap.push(...position)
      }
    })
  }
}

export function addCacheReact(content: string) {
  for (const match of content.matchAll(/className="([^"]+)"/gs)) {
    if (!match)
      continue
    const attributes = match[1].replace(/[\w\-@:]+="[^"]+"/g, '').trim().replace(/\s+/g, ' ')
    if (!attributes)
      continue
    // 过滤缓存已有的属性
    const attrs = attributes.split(' ').filter(attr =>
      !cacheMap.has(attr),
    )

    for (const attr of attrs) {
      if (cacheMap.has(attr))
        continue
      transformUnocssBack(attr).then(r =>
        r && cacheMap.set(attr, r),
      )
    }
  }
}

export function highlight(realRangeMap: vscode.Range[]) {
  const editor = vscode.window.activeTextEditor
  if (!editor)
    return
  editor.edit(() => editor.setDecorations(decorationType, realRangeMap))
}

export function getPosition(content: string, pos: number) {
  const contents = content.split('\n')
  let num = 0
  for (let i = 0; i < contents.length; i++) {
    const len = contents[i].length
    if ((num <= pos) && (pos <= (num + len))) {
      return {
        line: i,
        character: pos - num,
      }
    }
    num += contents[i].length + (i === 0 ? 0 : 1)
  }
}
