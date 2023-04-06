import * as vscode from 'vscode'
// import { CssToUnocssProcess } from './process'
import { transformUnocssBack } from './utils'
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// 'use strict'
// import { CssToUnocssProvider } from './provider';

// let config = null
// 插件被激活时调用activate
export function activate(context: vscode.ExtensionContext) {
  // config = vscode.workspace.getConfiguration('to-unocss')
  // let provider = new CssToUnocssProvider(process);
  const LANS = ['html', 'vue', 'swan', 'wxml', 'axml', 'css', 'wxss', 'acss', 'less', 'scss', 'sass', 'stylus', 'wxss', 'acss']
  // for (let lan of LANS) {
  //     //为对应类型文件添加代码提示
  //     let providerDisposable = vscode.languages.registerCompletionItemProvider(lan, provider);
  //     context.subscriptions.push(providerDisposable);
  // }

  // 注册hover事件
  vscode.languages.registerHoverProvider(LANS, {
    async provideHover(document, position) {
      // 获取当前选中的文本范围
      const editor = vscode.window.activeTextEditor
      if (!editor)
        return

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
      md.appendMarkdown(`<span style="color:green">${css}</span>\n`)

      return new vscode.Hover(md)
    },
  })

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate() { }
