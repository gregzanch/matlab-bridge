"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const session = new lib_1.MatlabSession();
        console.log('Initializing Matlab...');
        yield session.initialize();
        console.log('Matlab initialized');
        const output = yield session.evaluateScript(`
    a = linspace(1, 25, 25)';
    b = a.*2;
    jsonencode(b)
    result.a = a;
    result.b = b;
    jsonencode(result)
  `);
        console.log('output', output);
        const workspace = yield session.getWorkspace();
        console.log('workspace', workspace);
    });
}
main().catch(console.error);
