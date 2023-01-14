import { spawn, execSync, ChildProcessWithoutNullStreams } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { guid } from './util/guid';
import * as path from 'path';
import { homedir } from 'os';

function getMatlabPath() {
  const matlabPath = execSync('which matlab').toString().trim();
  if (matlabPath === '') {
    throw new Error('Matlab not found');
  }
  return matlabPath;
}

function createTempFile(tempDir: string, source: string) {
  const fileName = guid('m') + '.m';
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, fileName);
  writeFileSync(filePath, source, 'utf8');
  return filePath;
}

export class MatlabSession {
  public initialized = false;

  private process: ChildProcessWithoutNullStreams | null;
  private matlabPath: string;
  private tempDir: string;

  static DEFAULT_TEMP_PATH = `${homedir()}/.matlab-bridge/tmp`;
  static DEFAULT_JSONLAB_PATH = `${homedir()}/.matlab-bridge/jsonlab`;

  constructor(matlabPath?: string) {
    this.matlabPath = matlabPath || getMatlabPath();
    this.process = null;
    this.tempDir = MatlabSession.DEFAULT_TEMP_PATH;
  }

  async addJsonlabPath(path: string) {
    if (!existsSync(path)) {
      throw new Error(`Path ${path} does not exist`);
    }
    await this.eval(`addpath('${path}')`);
  }

  async initialize(): Promise<boolean> {
    this.process = spawn(this.matlabPath, ['-nodesktop', '-nosplash']);

    this.process.addListener('error', err => {
      console.log(err);
    });
    this.process.addListener('close', (code: number) => {
      console.log(`child process exited with code ${code}`);
    });

    process.on('beforeExit', () => this.process?.kill());

    return new Promise(resolve => {
      const onData = function (this: MatlabSession, data: Buffer) {
        const message = data.toString();
        const messagesFinished = message.includes('>>');
        if (messagesFinished) {
          this.initialized = true;
          this.process?.stdout.removeListener('data', onData);
          resolve(this.initialized);
        }
      }.bind(this);

      this.process?.stdout.addListener('data', onData);
    });
  }

  async close(): Promise<void> {
    this.process?.kill();
    this.initialized = false;
  }

  async eval(code: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Matlab not initialized');
    }

    return new Promise(resolve => {
      let output = '';
      const onData = function (this: MatlabSession, data: Buffer) {
        const message = data.toString();
        const messagesFinished = message.includes('>>');
        if (messagesFinished) {
          this.process?.stdout.removeListener('data', onData);
          resolve(output);
        } else {
          output += message;
        }
      }.bind(this);

      this.process?.stdout.addListener('data', onData);
      this.process?.stdin.write(`${code}\n`);
    });
  }

  async evaluateScript(script: string, asJson = false): Promise<string> {
    const filePath = createTempFile(this.tempDir, script);
    console.log(filePath);
    const result = await this.eval(`run('${filePath.slice(0, -2)}')`);
    try {
      return asJson ? (JSON.parse(result) as string) : result;
    } catch (err) {
      return result;
    } finally {
      execSync(`rm ${filePath}`);
    }
  }

  async clearAll(): Promise<void> {
    await this.eval('clear all');
  }

  async getWorkspace<T = any>(): Promise<T | string> {
    const scriptSource = `
      who__tmp = who;
      for i__tmp = 1:length(who__tmp)
        value = eval(cell2mat(who__tmp(i__tmp)));
        ws_dict__temp.(cell2mat(who__tmp(i__tmp))) = value;
      end
      disp(savejson('',ws_dict__temp))
      clearvars who__tmp ws_dict__temp i__tmp;
    `;

    const output: string = await this.evaluateScript(scriptSource);
    try {
      return JSON.parse(output) as T;
    } catch (err) {
      return output;
    }
  }
}
