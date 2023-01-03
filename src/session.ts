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

  constructor(matlabPath?: string) {
    this.matlabPath = matlabPath || getMatlabPath();
    this.process = null;
    this.tempDir = path.join(MatlabSession.DEFAULT_TEMP_PATH, guid('m'));
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
  }

  private createTempFile(source: string) {}

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

  async evaluateScript(script: string): Promise<string> {
    const filePath = createTempFile(this.tempDir, script);
    console.log(filePath);
    return await this.eval(`run('${filePath.slice(0, -2)}')`);
  }

  async clearAll(): Promise<void> {
    await this.eval('clear all');
  }

  async getWorkspace<T = any>(): Promise<T | string> {
    const scriptSource = `
      who__temp__ignore=who;
      for i=1:length(who__temp__ignore)
          ws_dictionary__temp__ignore.(cell2mat(who__temp__ignore(i)))=eval(cell2mat(who__temp__ignore(i)));
      end
      
      disp(jsonencode(ws_dictionary__temp__ignore))
      
      clearvars -regexp ^who__temp__ignore$
      clearvars -regexp ^ws_dictionary__temp__ignore$
      clearvars -regexp ^i$
    `;

    const output: string = await this.evaluateScript(scriptSource);
    try {
      return JSON.parse(output) as T;
    } catch (err) {
      return output;
    }
  }
}
