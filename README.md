# pi-assumptions

A small extension for the [pi](https://pi.dev) coding agent.

When you give an agent a task, there are usually details you didn't mention, like the byte order or the units. Normally the agent either guesses quietly or stops to ask you. With this extension it picks a reasonable default, writes the assumption down and keeps going. When it's finished, you can look through what it assumed and tell it which ones are wrong.

I built it as a small project to get to know pi's extension API.

## How it works

The extension adds a tool called `flag_assumption`. Every time the agent has to guess something, it calls the tool with a short sentence and how sure it is (low, medium or high).

- The footer shows how many assumptions are waiting, for example `3 assumption(s) to review: /assumptions`.
- If the agent isn't very sure (low), you also get a warning right away.
- Type `/assumptions` to see the list. Select one that's wrong and the agent goes back and fixes the code that depended on it. Press Esc if they all look fine.

The assumptions are saved in the session, so they're still there after `/reload` or `pi --continue`.

## Trying it out

You need Node.js 22.19 or newer. Install pi, clone this repo and start pi with the extension:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
git clone https://github.com/Sana8200/pi-assumptions
mkdir test && cd test
pi -e ../pi-assumptions/assumptions.ts
```

Log in with `/login` and give it a task that leaves some details open, for example:

```text
Write rpm.py with a function that converts 2 raw CAN bytes to motor rpm.
```

Then type `/assumptions` to see what it guessed.

If you want to keep it installed instead of using `-e` every time:

```bash
pi install git:github.com/Sana8200/pi-assumptions
```

## How I built it

Everything is in [assumptions.ts](assumptions.ts), around 70 lines. These are the parts of the pi API it uses:

- `pi.registerTool` for the `flag_assumption` tool, with a TypeBox schema for the text and the confidence
- `promptSnippet` and `promptGuidelines` to tell the model when to use the tool
- `ctx.ui.setStatus` and `ctx.ui.notify` for the footer count and the warning
- `pi.registerCommand` for `/assumptions`, together with `ctx.ui.select` and `pi.sendUserMessage`
- the tool result's `details` and the `session_start` event, to save the flags in the session and load them again with `ctx.sessionManager.getBranch()`

To type-check it, run `npm install` and then `npm run check`.

## Things I noticed while testing

- At first the model put all of its assumptions into one flag. My guideline said "call flag_assumption once", and it understood that as once in total. Changing it to "separately for each assumption" fixed it.
- In one run, the model guessed a scaling (0.1 °C/bit with a −40 °C offset) and then said it was from the SAE J1939 standard. So the flags only show what the model admits is a guess. If it's confidently wrong, nothing gets flagged.
- The tests the model wrote only checked that the code did what it had assumed, so they couldn't catch a wrong assumption.

## What I'd like to add

- Marking a flag as done once it's been fixed
- An advisor that compares the flags with the code the agent actually changed

---

Tested with pi 1.3.0 and Gemini Flash models. MIT licensed.
