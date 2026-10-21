# pi-assumptions

An extension for the [pi](https://pi.dev) coding agent. Instead of stopping to ask, the agent flags each assumption it makes and keeps working. You review the flags later and send back the ones that are wrong.

## Why

Tasks often leave details open, such as byte order or units. Agents either guess silently or stop to ask. This is a middle ground: the guess is visible, and the work keeps going.

## What it does

| Part | What it does |
|---|---|
| `flag_assumption` tool | The agent records an assumption with a confidence level: low, medium or high |
| Footer | Shows how many assumptions are waiting for review |
| Warning | Only low-confidence assumptions interrupt you; the rest wait |
| `/assumptions` | Lists the flags. Pick a wrong one, and the agent fixes the work that depends on it |
| Session storage | Flags survive `/reload` and `pi --continue` |

## Try it

Needs Node.js 22.19 or newer.

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
git clone https://github.com/Sana8200/pi-assumptions
mkdir test && cd test
pi -e ../pi-assumptions/assumptions.ts
```

Log in with `/login`, then give pi a task that leaves details open:

```text
Write rpm.py with a function that converts 2 raw CAN bytes to motor rpm.
```

When it's done, type `/assumptions` to review the flags.

## How it works

| pi API | Used for |
|---|---|
| `pi.registerTool` | The `flag_assumption` tool, with a TypeBox schema for `text` and `confidence` |
| `promptSnippet`, `promptGuidelines` | Telling the model when to use the tool |
| `ctx.ui.setStatus`, `ctx.ui.notify` | The footer count and the low-confidence warning |
| `pi.registerCommand` | `/assumptions`, using `ctx.ui.select` and `pi.sendUserMessage` |
| Tool-result `details`, `session_start` | Saving flags in the session and rebuilding them with `ctx.sessionManager.getBranch()` |

## What I noticed while testing

- At first the model put all its choices into one flag. The guideline said "call flag_assumption once", and the model read that as once in total. Changing it to "separately for each assumption" fixed it.
- In one run, the model called a guessed scaling (0.1 °C/bit with a −40 °C offset) an SAE J1939 standard. Flags only show what the model admits is a guess.
- The model's own tests only checked that the code did what it had assumed.

## Next ideas

- Mark a flag as handled once it has been fixed.
- An advisor that checks the flags against the code the agent actually changed.

Tested with pi 1.3.0 and Gemini Flash models.
