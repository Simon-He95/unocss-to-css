import { createGenerator } from '@unocss/core';
import presetUno from '@unocss/preset-uno';
export function transformUnocssBack(code) {
    return new Promise((resolve) => {
        createGenerator({}, {
            presets: [presetUno()],
        })
            .generate(code || '')
            .then((res) => {
            const css = res.getLayers();
            const reg = new RegExp(`${escapeRegExp(code)}([:\\>][\\w\\-\\(\\)]+)?{(.*)}`);
            const match = css.match(reg);
            if (!match)
                return resolve('');
            const result = match[0].replace(match[2], match[2].replace(/[:,]/g, v => `${v} `)).replace('{', ' {\n  ').replace(/;/g, ';\n  ').replace('  }', '}');
            resolve(result);
        });
    });
}
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\%:\!\&\>]/g, '\\\\\\$&');
}
