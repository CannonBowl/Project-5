@echo off
setlocal

:: Change to the front_end directory
pushd front_end
echo Inside the frontend
echo Type-checking the front end
call tsc --strict main.ts
popd

:: Type-check the back end and run main.py
echo Type-checking the back end
pushd back_end
call python main.py --strict --ignore-missing-imports
echo Running
call python main.py
popd

echo Done