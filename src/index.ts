import * as vscode from 'vscode'
import { addCacheReact, addCacheVue, cacheMap, decorationType, highlight, transformUnocssBack } from './utils'

// 插件被激活时调用activate
export function activate(context: vscode.ExtensionContext) {
  // 将规则添加到语言配置中
  const LANS = ['html', 'vue', 'svelte', 'typescriptreact', 'solid', 'ts', 'tsx', 'js', 'jsx', 'swan', 'wxml', 'axml', 'css', 'wxss', 'acss', 'less', 'scss', 'sass', 'stylus', 'wxss', 'acss']
  const activeTextEditor = vscode.window.activeTextEditor
  if (!activeTextEditor)
    return
  const document = activeTextEditor.document

  const md = new vscode.MarkdownString()
  md.isTrusted = true
  md.supportHtml = true

  // 注册hover事件
  vscode.languages.registerHoverProvider(LANS, {
    provideHover(document, position) {
      if (!document)
        return
      const editor = vscode.window.activeTextEditor
      if (!editor)
        return
      // 移除样式
      vscode.window.activeTextEditor?.setDecorations(decorationType, [])
      const selection = editor.selection
      const wordRange = new vscode.Range(selection.start, selection.end)
      let selectedText = editor.document.getText(wordRange)
      const realRangeMap: any = []
      const { line, character } = position
      const allText = document.getText()
      const lineText = allText.split('\n')[line]
      if (!selectedText) {
        let _text = lineText[character]
        if (!_text || /[><\s\/]/.test(_text))
          return
        let i = character
        let c
        while ((c = lineText[--i]) !== ' ' && c) {
          if (/[><\/]/.test(c))
            return
          _text = `${c}${_text}`
        }

        let j = character
        while (!/[\s\/"]/.test((c = lineText[++j])) && c) {
          if (/[><\/]/.test(c))
            return
          _text = `${_text}${c}`
        }

        if (_text.includes('="')) {
          const texts = _text.split('="')
          _text = texts.join('-')
          realRangeMap.push(new vscode.Range(new vscode.Position(line, i + 1), new vscode.Position(line, i + 1 + texts[0].length)))
          realRangeMap.push(new vscode.Range(new vscode.Position(line, j - texts[1].length), new vscode.Position(line, j)))
        }
        else {
          const newReg = new RegExp(`(\\w+)="[^"]*${_text}[^"]*"`, 'g')
          let isFind = false
          for (const match of lineText.matchAll(newReg)) {
            if (!match)
              continue
            const index = match.index!
            if (index <= character && character <= index + match[0].length) {
              isFind = true
              _text = `${match[1]}-${_text}`
              realRangeMap.push(new vscode.Range(new vscode.Position(line, i + 1), new vscode.Position(line, j)))
              realRangeMap.push(new vscode.Range(new vscode.Position(line, index), new vscode.Position(line, index + match[1].length)))
              break
            }
          }
          if (!isFind)
            realRangeMap.push(new vscode.Range(new vscode.Position(line, i + 1), new vscode.Position(line, j)))
        }
        selectedText = _text
      }
      else {
        if (selectedText.trim() === '')
          return

        const pos = lineText.indexOf(selectedText)
        let offsetLeft = 0

        while (selectedText[offsetLeft] === ' ')
          offsetLeft++
        let offsetRight = -1
        while (selectedText.slice(offsetRight)[0] === ' ')
          offsetRight--
        offsetRight++
        realRangeMap.push(new vscode.Range(new vscode.Position(line, pos + offsetLeft), new vscode.Position(line, pos + selectedText.length + offsetRight)))
        selectedText = selectedText.trim()
      }

      if (cacheMap.has(selectedText)) {
        const cacheText = cacheMap.get(selectedText)
        return setStyle(realRangeMap, cacheText)
      }
      return new Promise((resolve) => {
        transformUnocssBack(selectedText).then((css) => {
          if (!css)
            return resolve(null)
          cacheMap.set(selectedText, css)
          resolve(setStyle(realRangeMap, css))
        })
      })
    },
  })

  // 监听编辑器选择内容变化的事件
  vscode.window.onDidChangeTextEditorSelection(() => vscode.window.activeTextEditor?.setDecorations(decorationType, []))

  if (document) {
    const languageId = document.languageId
    if (languageId === 'vue')
      addCacheVue(document.getText() as string)
    else if (languageId === 'typescriptreact')
      addCacheReact(document!.getText() as string)
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
      if (!event.contentChanges.length)
        return
      if (languageId === 'vue')
        return addCacheVue(document.getText() as string)
      if (languageId === 'typescriptreact')
        return addCacheReact(document.getText() as string)
    }))
  }

  function setStyle(realRangeMap: any[], css: string) {
    // 增加decorationType样式
    highlight(realRangeMap)
    md.value = ''
    md.appendMarkdown('<a href="https://github.com/Simon-He95/unocss-to-css">Unocss To Css:</a>\n')
    md.appendCodeblock(css, 'css')
    return new vscode.Hover(md)
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }
