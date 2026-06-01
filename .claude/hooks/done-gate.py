#!/usr/bin/env python3
"""Stop hook: DONE-GATE.

Blocks the turn from ending when my last message CLAIMS a build step is
done/complete/verified/shipped UNLESS a fresh SHIP verdict file exists on record
for the work. Purpose: kill the silent-momentum failure where I declare a step
finished without ever running the critic gate.

A verdict lives in  proof/verdicts/<name>.verdict  and its FIRST token must be
SHIP or NO-SHIP. "Fresh" = the verdict file is at least as new as the newest
source (proof/**/*.mjs) and render (proof/out/*.png), i.e. nothing was changed
after the critic last looked.

Honest limit: this forces a critic SHIP to exist and be current. It cannot stop
deliberate forgery of a verdict file. It stops momentum, not willful lying.

Fails OPEN on any internal error (never wedges the session), but fails CLOSED on
a detected unbacked completion claim (that's the whole point).
"""
import json
import os
import re
import sys
import glob


def last_assistant_text(transcript_path):
    text = None
    with open(transcript_path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if obj.get("type") != "assistant":
                continue
            msg = obj.get("message", {})
            if msg.get("role") != "assistant":
                continue
            parts = [b.get("text", "") for b in (msg.get("content") or [])
                     if isinstance(b, dict) and b.get("type") == "text"]
            if parts:
                text = "\n".join(parts)
    return text


# A completion CLAIM = a step/work token co-occurring with a done token in the
# same message. Co-occurrence keeps ordinary conversation ("how do we do step 1")
# from tripping it, while catching the real failure ("step 1 is complete").
STEP_TOKENS = re.compile(r"\b(step|sub-?step|spike|plan|core|the head|milestone)\b", re.I)
DONE_TOKENS = re.compile(
    r"\b(done|complete|completed|finished|verified|ships?|shipped|"
    r"passes?\s+(qa|the\s+critic|review)|qa\s+pass(?:es|ed)?|"
    r"all\s+(checks?|tests?)\s+pass)\b", re.I)
# Strong standalone claim words that gate regardless of a step token.
STRONG = re.compile(r"\b(SHIP)\b")


def is_completion_claim(text):
    # ignore fenced code so a code sample can't trip it
    prose = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    # don't trip on the gate explaining itself / quoting the hook
    if "DONE-GATE" in prose or "done-gate" in prose:
        return False
    if STRONG.search(prose):
        return True
    return bool(STEP_TOKENS.search(prose) and DONE_TOKENS.search(prose))


def newest_mtime(patterns, exclude_dir):
    newest = 0.0
    for pat in patterns:
        for p in glob.glob(pat, recursive=True):
            if exclude_dir in p:
                continue
            try:
                m = os.path.getmtime(p)
                if m > newest:
                    newest = m
            except OSError:
                pass
    return newest


def fresh_ship_exists(root):
    vdir = os.path.join(root, "proof", "verdicts")
    if not os.path.isdir(vdir):
        return False
    work = newest_mtime([
        os.path.join(root, "proof", "**", "*.mjs"),
        os.path.join(root, "proof", "out", "*.png"),
    ], exclude_dir=os.sep + "verdicts" + os.sep)
    best_ship = 0.0
    for vf in glob.glob(os.path.join(vdir, "*.verdict")):
        try:
            with open(vf, "r", encoding="utf-8") as fh:
                head = fh.read(40).strip().upper()
            if head.startswith("SHIP"):
                m = os.path.getmtime(vf)
                if m > best_ship:
                    best_ship = m
        except OSError:
            pass
    # fresh = a SHIP verdict at least as new as the newest work artifact
    return best_ship > 0.0 and best_ship + 1.0 >= work


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return  # fail open
    transcript_path = payload.get("transcript_path")
    if not transcript_path:
        return
    try:
        text = last_assistant_text(transcript_path)
    except Exception:
        return
    if not text or not is_completion_claim(text):
        return  # no claim -> nothing to gate

    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    try:
        if fresh_ship_exists(root):
            return  # backed by a fresh SHIP verdict -> allow
    except Exception:
        return  # fail open on internal error

    reason = (
        "DONE-GATE: your message claims a step is done/verified/shipped, but no "
        "fresh SHIP verdict is on record in proof/verdicts/ (or work changed after "
        "the last verdict). Run the critic on the current step, write its verdict "
        "to proof/verdicts/<step>.verdict (first token SHIP or NO-SHIP), and only "
        "claim done if it SHIPs. Do not self-grade in place of the critic."
    )
    print(json.dumps({"decision": "block", "reason": reason}))


if __name__ == "__main__":
    main()
