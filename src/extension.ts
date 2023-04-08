import * as vscode from 'vscode'
import { transformUnocssBack } from './utils'

// let config = null
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
      // todo:获取hover文本正行元素分析
      const selection = editor.selection
      const wordRange = new vscode.Range(selection.start, selection.end)
      const range = document.getWordRangeAtPosition(position)
      const word = document.getText(range)
      // 获取当前选中的文本内容
      const selectedText = editor.document.getText(wordRange) || word
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
