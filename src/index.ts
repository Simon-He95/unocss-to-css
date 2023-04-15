import * as vscode from 'vscode'
import { transformUnocssBack } from './utils'

// 插件被激活时调用activate
export function activate() {
  // 将规则添加到语言配置中
  const LANS = ['html', 'vue', 'svelte', 'solid', 'ts', 'tsx', 'js', 'jsx', 'swan', 'wxml', 'axml', 'css', 'wxss', 'acss', 'less', 'scss', 'sass', 'stylus', 'wxss', 'acss']
  const { dark = {}, light = {} } = vscode.workspace.getConfiguration('unocss-to-css') || {}
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

  // 注册hover事件
  vscode.languages.registerHoverProvider(LANS, {
    async provideHover(document, position) {
      // 获取当前选中的文本范围
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
      const css = await transformUnocssBack(selectedText) as string
      if (!css)
        return

      // 增加decorationType样式
      editor.edit(() => editor.setDecorations(decorationType, realRangeMap.map((item: any) => item.range)))
      const md = new vscode.MarkdownString()
      md.isTrusted = true
      md.supportHtml = true
      md.appendMarkdown('<a href="https://github.com/Simon-He95/unocss-to-css">Unocss To Css:</a>\n')
      md.appendCodeblock(css, 'css')
      return new vscode.Hover(md)
    },
  })

  // 监听编辑器选择内容变化的事件
  vscode.window.onDidChangeTextEditorSelection(() => vscode.window.activeTextEditor?.setDecorations(decorationType, []))
}

// this method is called when your extension is deactivated
export function deactivate() { }
