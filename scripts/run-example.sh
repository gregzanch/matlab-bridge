#!/usr/bin/env bash

# get the first argument
EXAMPLE=$1

tsc -p tsconfig.examples.json && node "examples/$EXAMPLE.js"