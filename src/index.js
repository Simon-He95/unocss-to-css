import * as vscode from 'vscode';
import { transformUnocssBack } from './utils';
// 插件被激活时调用activate
export function activate() {
    const LANS = ['html', 'vue', 'swan', 'wxml', 'axml', 'css', 'wxss', 'acss', 'less', 'scss', 'sass', 'stylus', 'wxss', 'acss'];
    // 注册hover事件
    vscode.languages.registerHoverProvider(LANS, {
        async provideHover(document, position) {
            var _a, _b;
            // 获取当前选中的文本范围
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const selection = editor.selection;
            const wordRange = new vscode.Range(selection.start, selection.end);
            let selectedText = editor.document.getText(wordRange);
            if (!selectedText) {
                const range = document.getWordRangeAtPosition(position);
                let word = document.getText(range);
                const lineNumber = position.line;
                const line = document.lineAt(lineNumber).text;
                const wholeReg = new RegExp(`([\\w\\>\\[]+:)?(\\[[^\\]]+\\]:)?([\\w\\-\\[\\(\\!\\>\\&]+)?${word}(:*[^"\\s\\/>]+)?`, 'g');
                let matcher = null;
                for (const match of line.matchAll(wholeReg)) {
                    const { index } = match;
                    const pos = index + match[0].indexOf(word);
                    if (pos === ((_a = range === null || range === void 0 ? void 0 : range.c) === null || _a === void 0 ? void 0 : _a.e)) {
                        matcher = match;
                        break;
                    }
                }
                if (matcher)
                    word = matcher[0];
                matcher = null;
                const equalReg = new RegExp(`([\\[\\]\\(\\)\\>\\w\\-]+)=["'][^"']*${word}[^"']*["']`, 'g');
                for (const match of line.matchAll(equalReg)) {
                    // 找比range小但最近的
                    const { index } = match;
                    if (index > ((_b = range === null || range === void 0 ? void 0 : range.c) === null || _b === void 0 ? void 0 : _b.e))
                        break;
                    matcher = match;
                }
                if (matcher && matcher[1] !== 'class')
                    word = `${matcher[1]}-${word}`;
                selectedText = word;
            }
            if (!selectedText)
                return;
            const css = await transformUnocssBack(selectedText);
            if (!css)
                return;
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`<span style="color:green;font-weight: bold">${css}</span>\n`);
            return new vscode.Hover(md);
        },
    });
}
// this method is called when your extension is deactivated
export function deactivate() { }
