# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
CALarM is a cross-platform (Android & iOS) experimental alarm clock built with React Native and Expo.

## Build and Run

### Dependencies
Install dependencies using `yarn`:
```bash
yarn
```

### Development
Start the Expo development server:
```bash
yarn start
```

Run on specific platforms:
- **Android**: `yarn android`
- **iOS**: `yarn ios`
- **Web**: `yarn web`

### Build/Eject
To eject from Expo managed workflow:
```bash
yarn eject
```
## Edit Tool Rules
- If an Edit fails with "string not found", ALWAYS re-read the file before retrying
- Never attempt the same edit twice without re-reading
- After 2 consecutive Edit failures on the same file, use the Read tool to display the current contents, then construct a new edit based on what you actually see
- Do not "give up and say it builds" — verify the edit actually applied

## Strict Edit Strategy
- Use the SHORTEST POSSIBLE unique string for the `old_string` in the Edit tool.
- Aim for 3-5 lines of context maximum. 
- If the file has complex indentation, include only one level of indentation in your search block to avoid whitespace mismatches.
- Prefer searching for unique identifiers (function names, variable declarations) rather than generic closing braces.

## Formatting Constraints
- When using the Edit tool, copy text EXACTLY as it appeared in the last Read output, including trailing spaces or tabs.
- Do not attempt to "fix" or "cleanup" the code within the `old_string` block; it must be a literal match.

## File Path Rules (Workaround for Claude Code v1.0.111 Bug)
- When reading or editing a file, **ALWAYS use relative paths.**
- Example: `./src/components/Component.tsx` ✅
- **DO NOT use absolute paths.**
- Example: `/Users/user/project/src/components/Component.tsx` ❌
- Reason: This is a workaround for a known bug in Claude Code v1.0.111