"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tsup_1 = require("tsup");
exports.default = (0, tsup_1.defineConfig)({
    entry: [
        'src/index.ts',
    ],
    format: ['cjs'],
    shims: false,
    dts: false,
    external: [
        'vscode',
    ],
});
//# sourceMappingURL=tsup.config.js.map