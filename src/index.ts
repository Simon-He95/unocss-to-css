import * as vscode from 'vscode'
import { transformUnocssBack } from './utils'

// 插件被激活时调用activate
export function activate() {
  const LANS = ['html', 'vue', 'swan', 'wxml', 'axml', 'css', 'wxss', 'acss', 'less', 'scss', 'sass', 'stylus', 'wxss', 'acss']

  // 注册hover事件
  vscode.languages.registerHoverProvider(LANS, {
    async provideHover(document, position) {
      // 获取当前选中的文本范围
      const editor = vscode.window.activeTextEditor
      if (!editor)
        return
      const selection = editor.selection
      const wordRange = new vscode.Range(selection.start, selection.end)
      let selectedText = editor.document.getText(wordRange)
      if (!selectedText) {
        const range = document.getWordRangeAtPosition(position)
        let word = document.getText(range)
        const lineNumber = position.line
        const line = document.lineAt(lineNumber).text
        const wholeReg = new RegExp(`(\\w+:)?([\\w\\-\\[\\(\\!]+)?${word}(:*[^"\\s\\/>]+)?`)
        const matcher = line.match(wholeReg)
        if (matcher)
          word = matcher[0]
        const equalReg = new RegExp(`([\\w\\-]+)=["'][^"']*${word}[^"']*["']`)
        const match = line.match(equalReg)
        if (match && match[1] !== 'class')
          word = `${match[1]}-${word}`
        selectedText = word
      }

      if (!selectedText)
        return
      const css = await transformUnocssBack(selectedText) as string
      if (!css)
        return
      const md = new vscode.MarkdownString()
      md.appendMarkdown(`<span style="color:green;font-weight: bold">${css}</span>\n`)

      return new vscode.Hover(md)
    },
  })
}

// this method is called when your extension is deactivated
export function deactivate() { }