# pi-assumptions

An extension for the [pi](https://pi.dev) coding agent. When a task leaves a detail open, the agent picks a sensible default, flags it as an assumption and keeps working instead of stopping to ask. When it's done, you go through the flags and send back the ones that are wrong.

## Why I made this

Most tasks leave small things unsaid, like byte order or units. Agents usually handle that in one of two ways: they guess without telling you, or they stop and ask, and you have to keep coming back to answer. I wanted something in between. The agent still guesses, but every guess is written down so you can check it afterwards.

It was also a good way to learn how pi extensions work. The whole thing is one file, [assumptions.ts](assumptions.ts), about 70 lines.

## How it works

1. While working, the agent calls the `flag_assumption` tool once for each guess, with a confidence level: low, medium or high.
2. The footer keeps a count, for example `3 assumption(s) to review: /assumptions`.
3. Low-confidence flags also show a warning right away. Medium and high ones just wait in the count.
4. When you're ready, type `/assumptions` and pick the one that's wrong, or press Esc if they're all fine. The agent then gets a follow-up message saying the assumption was wrong and asking it to fix the work that depends on it.

Flags are saved in the session, so they're still there after `/reload` or `pi --continue`.

## Try it

You need Node.js 22.19 or newer.

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
git clone https://github.com/Sana8200/pi-assumptions
mkdir test && cd test
pi -e ../pi-assumptions/assumptions.ts
```

Log in with `/login`, then give pi a task that leaves some details open, for example:

```text
Write rpm.py with a function that converts 2 raw CAN bytes to motor rpm.
```

When it's done, type `/assumptions` to see what it guessed.

If you want to keep it instead of passing `-e` every time, you can install it as a pi package:

```bash
pi install git:github.com/Sana8200/pi-assumptions
```

## Under the hood

These are the parts of the pi extension API it uses:

| pi API | Used for |
|---|---|
| `pi.registerTool` | The `flag_assumption` tool, with a TypeBox schema for `text` and `confidence` |
| `promptSnippet`, `promptGuidelines` | Telling the model when to use the tool |
| `ctx.ui.setStatus`, `ctx.ui.notify` | The footer count and the low-confidence warning |
| `pi.registerCommand` | `/assumptions`, using `ctx.ui.select` and `pi.sendUserMessage` |
| Tool-result `details`, `session_start` | Saving flags in the session and rebuilding them with `ctx.sessionManager.getBranch()` |

To type-check after making changes:

```bash
npm install
npm run check
```

## What I noticed while testing

- At first the model put all of its choices into a single flag. The guideline said "call flag_assumption once", and the model read that as once in total. Changing it to "separately for each assumption" fixed it.
- In one run, the model said a scaling it had guessed (0.1 °C/bit with a −40 °C offset) was the SAE J1939 standard. So flags only catch what the model admits is a guess. If it's confidently wrong, nothing gets flagged.
- The tests the model wrote only checked that the code did what it had assumed, so they couldn't catch a wrong assumption.

## Ideas for later

- Mark a flag as handled once it has been fixed.
- An advisor that checks the flags against the code the agent actually changed.

## Notes

Tested with pi 1.3.0 and Gemini Flash models. If you try it and something doesn't work, feel free to open an issue.

MIT licensed, see [LICENSE](LICENSE).
