#!/bin/bash
set -e
echo "Type-checking the front end"
tsc --strict main.ts

echo "Type-checking the back end"

echo "Running"
python3 main.py

echo "Done"
