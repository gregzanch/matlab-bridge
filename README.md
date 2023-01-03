# Matlab Bridge 🌁

Runs Matlab code in typescript/javascript

## Overview

This package acts as a middle man between node.js and Matlab. You can interact with Matlab through a `Session`, which is simply a wrapper around Matlab's REPL

## Getting started

Add `matlab-bridge` to your node.js project.

```shell
yarn add matlab-bridge
```

Creating a `Session`

```js
const session = new MatlabSession();
await session.initialize();
```

Evaluating a block of code

```js
const output = await session.evaluateScript(`
  a = linspace(1, 5, 5)';
  b = a.*2;
  result.a = a;
  result.b = b;
  jsonencode(result)
`);
```

Get the whole workspace
```js
const workspace = await session.getWorkspace();
```

