import * as vscode from 'vscode'
import { addCache, cacheMap, transformUnocssBack } from './utils'

// 插件被激活时调用activate
export function activate(context: vscode.ExtensionContext) {
  // todo: 提前hover前做一次编辑器文本的cache，针对vue文件中的template
  // 将规则添加到语言配置中
  const LANS = ['html', 'vue', 'svelte', 'solid', 'ts', 'tsx', 'js', 'jsx', 'swan', 'wxml', 'axml', 'css', 'wxss', 'acss', 'less', 'scss', 'sass', 'stylus', 'wxss', 'acss']
  const { dark = {}, light = {} } = vscode.workspace.getConfiguration('unocss-to-css') || {}
  const document = vscode.window.activeTextEditor!.document

  let timer: any = null
  const md = new vscode.MarkdownString()
  md.isTrusted = true
  md.supportHtml = true
  const style = {
    dark: Object.assign({
      textDecoration: 'underline',
      backgroundColor: 'rgba(144, 238, 144, 0.5)',
      color: 'black',
    }, dark),
    light: Object.assign({
      textDecoration: 'underline',
      backgroundColor: 'rgba(255, 165, 0, 0.5)',
      color: '#ffffff',
    }, light),
  }
  const decorationType = vscode.window.createTextEditorDecorationType(style)

  // 异步解析content

  // 注册hover事件
  setTimeout(() => {
    vscode.languages.registerHoverProvider(LANS, {
      provideHover(document, position) {
        const offset = document.offsetAt(position)
        // 如果不在template 中或style中直接return
        const alltext = document.getText()
        const templateRange = getRange(alltext.match(/[\s\n]<template.*<\/template>/s))
        const styleRange = getRange(alltext.match(/[\s\n]<style.*<\/style>/))
        if (templateRange) {
          const [start, end] = templateRange
          if (!styleRange) {
            if ((offset < start || offset > end))
              return
          }
          else {
            const [start1, end1] = styleRange
            if ((offset < start || offset > end) && (offset < start1 || offset > end1))
              return
          }
        }
        if (timer)
          clearTimeout(timer)
        const editor = vscode.window.activeTextEditor
        if (!editor)
          return
        // 移除样式
        vscode.window.activeTextEditor?.setDecorations(decorationType, [])
        const selection = editor.selection
        const wordRange = new vscode.Range(selection.start, selection.end)
        let selectedText = editor.document.getText(wordRange)
        const realRangeMap: any = []
        if (!selectedText) {
          const range = document.getWordRangeAtPosition(position) as any
          const line = range.c.c
          let word = document.getText(range)
          const lineNumber = position.line
          const lineText = document.lineAt(lineNumber).text
          const wholeReg = new RegExp(`([\\w\\>\\[]+:)?(\\[[^\\]]+\\]:)?([\\w\\-\\[\\(\\!\\>\\&]+)?${word}(:*[^"\\s\\/>]+)?`, 'g')
          let matcher = null

          for (const match of lineText.matchAll(wholeReg)) {
            const { index } = match
            const pos = index! + match[0].indexOf(word)
            if (pos === range?.c?.e) {
              matcher = match
              realRangeMap.push({
                content: match[0],
                range: new vscode.Range(
                  new vscode.Position(line, index!),
                  new vscode.Position(line, index! + match[0].length),
                ),
              })
              break
            }
          }
          if (matcher)
            word = matcher[0]
          matcher = null
          const equalReg = new RegExp(`([\\[\\]\\(\\)\\>\\w\\-]+)=["'][^"']*${word}[^"']*["']`, 'g')
          for (const match of lineText.matchAll(equalReg)) {
            // 找比range小但最近的
            const { index } = match
            if (index! > range?.c?.e)
              break
            matcher = match
          }
          if (matcher && matcher[1] !== 'class') {
            word = `${matcher[1]}-${word}`
            realRangeMap.push({
              range: new vscode.Range(
                new vscode.Position(line, matcher.index!),
                new vscode.Position(line, matcher.index! + matcher[1].length),
              ),
              content: matcher[1],
            })
          }
          selectedText = word
        }

        if (!selectedText)
          return
        if (cacheMap.has(selectedText)) {
          const cacheText = cacheMap.get(selectedText)
          if (!cacheText)
            return
          return setStyle(editor, realRangeMap, cacheText)
        }
        return new Promise((resolve) => {
          timer = setTimeout(() => {
            transformUnocssBack(selectedText).then((css) => {
              if (!css)
                return resolve(null)
              cacheMap.set(selectedText, css)
              resolve(setStyle(editor, realRangeMap, css))
            })
          }, 200)
        })
      },
    })
  }, 500)

  // 监听编辑器选择内容变化的事件
  vscode.window.onDidChangeTextEditorSelection(() => vscode.window.activeTextEditor?.setDecorations(decorationType, []))
  const languageId = document.languageId
  if (languageId === 'vue')
    addCache(document.getText() as string)

  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
    if (languageId === 'vue' && event.contentChanges.length)
      addCache(document!.getText() as string)
  }))

  function setStyle(editor: vscode.TextEditor, realRangeMap: any[], css: string) {
    // 增加decorationType样式
    editor.edit(() => editor.setDecorations(decorationType, realRangeMap.map((item: any) => item.range)))
    md.value = ''
    md.appendMarkdown('<a href="https://github.com/Simon-He95/unocss-to-css">Unocss To Css:</a>\n')
    md.appendCodeblock(css, 'css')
    return new vscode.Hover(md)
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }

function getRange(match: RegExpMatchArray | null) {
  if (!match)
    return []
  const start = match.index!
  const end = start + match[0].length
  return [start, end]
}
