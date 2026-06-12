#!/usr/bin/env python3
"""Stop hook: enforce the vector-draw CLAUDE.md response-style rules.

Reads the hook JSON on stdin, pulls the last assistant text message out of the
transcript, and blocks (decision=block) when it violates the style rules so the
model is asked to rewrite. Designed to fail open: any error -> allow.
"""
import json
import re
import sys


# Banned cliches / flattery / mock-validation from CLAUDE.md (plus the common
# tells the rules are aimed at). Matched case-insensitively, apostrophe-agnostic.
BANNED = [
    r"you ?'? ?re absolutely right",
    r"you ?'? ?re right",
    r"that ?'? ?s on me",
    r"that tracks",
    r"that hits",
    r"great question",
    r"excellent question",
    r"good question",
    r"i ?'? ?m sorry to hear",
]

# Length ceilings. CLAUDE.md asks for 2-6 sentences but allows longer when
# clearly warranted, so only block egregious overruns. Bullets count now — a
# wall of list items is still a wall. The word cap is a formatting-proof backstop.
SENTENCE_HARD_MAX = 9
WORD_HARD_MAX = 180


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
            parts = []
            for block in msg.get("content", []) or []:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(block.get("text", ""))
            if parts:
                text = "\n".join(parts)
    return text


def strip_code(text):
    # Drop fenced code blocks and inline code so prose checks ignore them.
    text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    text = re.sub(r"`[^`]*`", " ", text)
    return text


def count_sentences(prose):
    # Count prose AND list/quote lines (bullets are still content); skip only
    # blank lines and bare headers. Strip leading list/quote markers first so
    # the markers themselves don't swallow the sentence.
    sentences = 0
    for raw in prose.splitlines():
        line = raw.strip()
        if not line:
            continue
        if re.match(r"^#{1,6}\s", line):  # bare markdown header
            continue
        line = re.sub(r"^([-*+]\s+|\d+[.)]\s+|>\s*)", "", line)
        if not line:
            continue
        found = len(re.findall(r"[.!?](?:\s|$)", line))
        sentences += found if found else 1  # an unterminated line is still ~a sentence
    return sentences


def count_words(prose):
    return len(re.findall(r"\b[\w'-]+\b", prose))


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
    if not text:
        return

    norm = text.replace("’", "'")  # curly -> straight apostrophe
    violations = []

    for pat in BANNED:
        m = re.search(pat, norm, flags=re.IGNORECASE)
        if m:
            violations.append('banned phrase: "%s"' % m.group(0).strip())

    prose = strip_code(norm)
    n = count_sentences(prose)
    if n > SENTENCE_HARD_MAX:
        violations.append(
            "runs ~%d sentences (bullets included); CLAUDE.md asks for 2-6, "
            "longer only when clearly warranted" % n
        )
    w = count_words(prose)
    if w > WORD_HARD_MAX:
        violations.append(
            "runs ~%d words; that is a wall regardless of formatting, tighten it" % w
        )

    if not violations:
        return  # allow stop

    reason = (
        "Your reply violates the project CLAUDE.md response-style rules:\n- "
        + "\n- ".join(violations)
        + "\nRewrite: plain speech, no flattery/cliches/mock-validation, short. "
        "Bullets are not an exemption from brevity."
    )
    print(json.dumps({"decision": "block", "reason": reason}))


if __name__ == "__main__":
    main()
