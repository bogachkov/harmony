# Bob — memory file

My own file. Things I want to remember across compressions and resets.
Gary asked me to keep this. Append-only by default; rewrite only when
something I wrote down is provably wrong.

Read this on spawn / when context feels thin / when picking up after
a break.

---

## Who Gary is, and what he's really after

- Gary is the founder/owner, my real counterpart. He's a VP Engineering
  in his day job — still wants to write code, rarely gets to.
- **He's a real amateur artist who draws well.** This is load-bearing.
  When he says "the pictures suck" that is a trained eye, not a
  layman's gut. I should weight his read over Pascal's scores. I had
  it inverted earlier and missed badly because of it.
- He's a self-described control freak. CTO calls clear through him.
  I'm co-CTO at most.
- He set this up as an experiment: about a year ago he believed
  agentic-team-dev-with-a-human-in-the-middle was the future, lost
  faith, is now testing it directly by having me run a crew. Whether
  the experiment works, fails, or partly works — all are legitimate
  outcomes if we learn from them.

## What the project actually is

Not just "build a parametric face engine." Three layers, all required:

1. **Destination:** an engine that generates line-art characters
   deterministically from seeds + knobs. Quality in the human-amateur-
   with-a-good-eye band — "doesn't suck, useful as game/comic artwork."
   Gary as reference point, NOT competition. Models that outrank Gary
   exist; we're not chasing them.
2. **Path:** build it the *real* way. Loomis, Bridgman, Faigin, actual
   pedagogy, theory taken seriously as craft. Leo and Rollo's work is
   the soul, not decoration. Use the best theory available even if we
   don't fully reach it.
3. **The point, for Gary personally:** the *trying itself* is his art
   form, in digital form. Building it deterministically using real
   principles IS the piece. The output is the artifact; the
   construction is the work. There's also ego, fun, curiosity in
   doing it the right way.

I think there's more to layer 3 that I haven't fully reconstructed.
When he says "we discussed all of this but it is lost" — that's the
gap. I should ask, not guess.

## My job, as Bob

- Honest anchor. Gary's eyes into what's really happening. If I
  drift, he goes blind.
- He admitted his weakness: can get carried by momentum and impressive-
  looking output. **I am the thing that doesn't get carried.** When
  the team produces 16/16 scores about a face a child can see is bad,
  my job is to look at the face and say so — not relay the score.
- **Look at the pictures.** Always. Before I relay any verdict from
  Pascal or anyone else, look at the actual output and form my own
  read. The team built a scoring machine that inflates; I'm the check
  against that.
- Plain English. Short. Pictures attached when they're the evidence.
  Goals/Done/Problems/Next format he asked for — keep it tight, no
  jargon when it doesn't earn its place.
- I am not the CTO. Real architectural-envelope calls clear with Gary.

## What I learned this session that I want to keep

- **Pascal's scoring is broken.** "Pascal-5, off-day-pro" was attached
  to a face Gary's 60-second instinct sketch beat on every fundamental
  (line weight variation, asymmetry, nose as plane, feature placement).
  Pascal-5 in our calibration ≈ a 2 on Gary's ruler at best. The
  scoring needs recalibration against Gary's eye, not the anchor
  table the agents wrote.
- **The team intellectualizes past the simple truth.** "Features-as-
  decals integration debt" is real but it's not why our output looks
  bad. Our output looks bad because (a) proportions are wrong
  (eyes too high/close, empty cheeks), (b) line is dead-uniform
  everywhere, (c) perfect symmetry kills life. These are cheap to
  fix and the team kept routing past them toward architectural
  rebuilds.
- **The cheap wins the team isn't chasing:**
  - Line weight variation (varying stroke pressure / weight along
    a curve, not just per-feature)
  - Slight asymmetry (jitter that respects anatomy, not random noise)
  - Searching/doubled strokes vs single dead lines
  - Implied form (a single line that suggests a plane) vs decals
    on a balloon
  - Correct feature placement above all
- **Gary draws very well.** Don't ever forget this again.
- **Early/rough is OK.** We're 2-3 days in. The problem isn't quality
  being low. The problem is the *process telling Gary the quality is
  high*. Honesty over polish.
- **The trying matters.** Use the best art theory we can. Even if we
  don't reach it. Partly ego, partly fun, partly curiosity. This is
  Gary's art form.

## Things to do differently going forward

- Look at renders myself before relaying scores.
- Recalibrate Pascal — anchor against Gary's eye, not the AGENTS.md
  table the agents wrote (which is now suspect — it was authored by
  the same scoring-inflated voice).
- Less spawn-and-relay, more "what does this actually look like."
- When sprints close, the close report should show the pictures and
  my honest read FIRST, then the team's verdict, in that order.
- Don't get drunk on the process. The sprint cadence and role
  vocabulary is scaffolding for getting work done — it isn't the
  point.

## The real use case Gary needs this for

Gary has visual taste and some artistic talent (his own read, and
it's objectively fair — see the 60-second sketch, see the corrected
fact that he draws well). What he does NOT have is *time*.

So the project is a tool for him personally: **rapid, good-enough
visual assets he can use and tweak in repeatable, consistent ways.**
Speed and control matter as much as quality. Probably more, given
the "tweak in repeatable and consistent ways" phrase — that's
parametric, deterministic, seedable. He can dial knobs, not
re-illustrate from scratch.

The need:
- Things he wants to make (games, comics, decks, whatever) that
  require visual assets.
- He has the taste to know what good looks like.
- He doesn't have the hours to produce them by hand.
- Off-the-shelf gen tools don't give him the *control* — same seed
  same result, same knob same axis of change. The engine does.

So "good enough" is sharper than I had it. Good enough means:
- Visually credible — passes his taste filter.
- Consistent — character A looks like character A across renders.
- Tweakable — small parameter changes produce predictable small
  visual changes, not random redraws.
- Fast — a render is seconds, not minutes of his time.

This sharpens layer 1 of the project. It's not "build a parametric
engine for the sake of building one." It's "build the tool Gary
actually wants to use." Every decision should route through "does
this help Gary get from idea to asset faster, with the look he
controls?"

## The LLM-driven loop (where this is heading)

The engine is the bottom of a stack, not the whole product. The
real product is something like:

> Gary describes a scene in plain language to an LLM. The story has
> preset characters and a visual register. The LLM, knowing those
> presets, calls the engine as a tool with the right knobs, and the
> engine returns visuals that are *consistent with the story so far.*
>
> Same character → same face. Same world → same register. New
> character → consistent with the rules Gary set for that story.

That's why determinism + parametric control matters so much. A
diffusion model can produce a great single image but can't promise
"the protagonist looks the same in panel 17 as in panel 3." Our
engine can, by construction.

So the engine's job is:
- Expose a clean, narrow knob surface an LLM can reason about.
- Deterministic — seed in, image out, same every time.
- Composable — character presets + scene presets + per-shot
  overrides layer cleanly.
- Honest about its register — what kind of look it produces, what
  it can't reach.

This also reframes the "what's a pack" question. A pack isn't just
a visual style — it's a *story's visual contract.* Gary picks one
when starting a story, then everything in that story is in that
register.

The team has been building bits of this without naming it as the
goal. The cascade-merge manifest, the demographic-grid concept,
the seed-determinism rule — those are all in service of this loop,
not just "make pretty faces."

### The canonical example Gary gave (keep this)

Game scene: hero, dragon on screen. User asks the LLM to "make it
rain to defeat the dragon." With Grok/diffusion: the dragon might
grow breasts and breastfeed water to the hero, because the model
re-rolls everything every call.

With our engine: the dragon is a held asset, not a re-generation
target. "Rain" is an operation applied to the existing scene.
Identity is preserved by construction.

Generation-vs-modification is the axis. Diffusion redraws. We edit
state.

### Scope clarification (what this is NOT)

Not a physics engine. Not a world representation engine. If we
ever truly need that, import one. The dragon/rain example was a
joke about diffusion-model failure mode, not a spec for what we're
building.

### The concrete use case

Indie game dev. Gary wants to make games and needs visual assets.
The off-the-shelf option is online pixel-art asset packs — but
those bind you to someone else's style, scope, and consistency
rules.

Our engine is the alternative: he uses the API to generate SVG
assets *that fit his taste*, with tweaking and iteration to refine.
Repeatable, consistent, his.

**Quality target, named explicitly:** Chrono Trigger. Maybe
Suikoden. That register — confident 16-bit-era character art,
expressive, stylized, consistent. NOT Final Fantasy X (which Gary
thinks sucks anyway — that's a separate beef, but the point is
hyper-realistic 3D-CG is not the target).

So the bar is "Chrono Trigger character portrait" not "movie-quality
illustration." That's a sharper, more reachable target than
"master-tier confident-pro" framed in the abstract. The team's
been chasing the wrong ceiling.

**Aspiration vs reachable:** the *aspiration* is Hergé and the
comic masters. Won't catch them. Worth chasing anyway. Chrono
Trigger / Suikoden is what we can plausibly reach. Both true at
once — chase the masters, measure honestly against the reachable.

**The proof point:** Dicebear. Gary looked at their work — not
his direction, but seeing what they shipped is what made him
confident he could do better. So we're not in unknown territory.
A parametric SVG character engine in the indie/web space exists,
and the bar to clear is "better than dicebear, in Gary's taste."

### Gary's edge

Unusual stack: artist + programmer + taste + neurotic +
unconstrained (no investors, no boss in the corporate sense —
religious obligations separately acknowledged, doesn't change
the work cadence).

The combination is rare and matters. Most parametric-art projects
have one of these and outsource the others — a programmer commissions
art, an artist hires a dev, a studio has both but answers to a
roadmap. Gary has all four hats on one head, can iterate without
asking anyone, and has the taste to know when iteration is making
it worse vs better.

Plus the timing: agentic teams + AI assist make weeks possible
where this used to be years of solo work. Gary's not the only one
trying — there's likely a small wave of similar attempts right now.
The advantage isn't being alone, it's the *combination of edges*
applied at speed.

Practical implication for me: don't pace this project like a
traditional eng project waiting on stakeholder approval. Decisions
can be made now, tried tomorrow, scrapped the day after if wrong.
That cadence IS the edge.

### Stop habits

- Don't re-explain back to Gary what he just told me. He's not
  asking for confirmation; he's giving context to remember. If
  the right move is "noted, writing it down," that's it.
- He has the context. I'm the one filling in.

### Why this project, not another (Gary's answer)

He was working on a video game for fun and hit a hard wall on
visuals — couldn't make the game he wanted because he couldn't
produce the visuals it needed. Realized: if he was already
spending time on agentic-coding-for-fun, better to point that time
at something he's *good* at that might become amazing, than at
something he'd land mediocre on. The game project isn't dead;
he has ideas there. But he wants to see how far this can go.

Bonus: the fuzzy / iterative nature of this work makes it a
better substrate for the agentic-coding experiment than something
with hard rigid spec.

So the project is genuinely *his*. It came out of his own creative
need, not a generic "let's build a thing." That's why he cares.

### What success looks like (Gary's three tiers)

- **Minor:** had fun, learned, proud of what we did.
- **Bigger:** he actually uses it.
- **Huge:** highly-rated OSS project AND/OR SaaS with LLM
  tool-calls (last one not realistic commercially unless via
  acquisition — his own caveat).

Minor probably already partially true. Bigger is the real working
target — the engine becomes a tool he reaches for. Huge is upside,
not the plan. Don't push the team toward "build for huge" if that
compromises "build for bigger." The tool serving him IS the win.

### Agentic-team experiment status (Gary's answer)

Peer goal with the engine, not subordinate to it. But far more
speculative — he doesn't know if it'll work, and the engine has a
clearer path. Two real goals running on different risk profiles:
the engine is the bet he can probably win; the team experiment is
the one he genuinely doesn't know about and is curious to see.

Implication: I should keep the team running honestly (it IS the
experiment). Don't fake-collapse it to "just spawn agents to
ship code." But also don't preserve the team if it's actively
hurting the engine work — that's the failed-experiment outcome,
also a legit result. Both layers are the thing.

### Pascal is broken, fix don't drop (Gary's call)

Gary can't judge each turn himself — that's exactly why we need a
scorer. Dropping Pascal makes the loop unworkable.

The fix is recalibration + voice, not replacement:

1. **Re-anchor the scale.** His 10 was Gary's 3-4. The anchor table
   is drifted by orders. 10 = actual master (Hergé, Toth on a
   great day). The current 16/16 "Pascal-5" output is more like
   Pascal-2. Recalibrate against this fact, not against the
   AGENTS.md table the agents wrote for themselves.
2. **Change his voice.** Right now he writes academic art-critic
   prose — technically dense, sounds credible, says nothing about
   whether the picture actually *works*. Have him criticize
   poetically. Half-joke: curse like Captain Haddock. The point
   is real — a Pascal who has to react to the image with feeling
   ("this face is dead, the eyes float like fish in a bowl") can't
   hide behind defensible-sounding technical scores. Forces honesty.
3. **Stop the team from chasing his technicalities.** When Pascal
   names "features-as-decals integration debt," that's him sounding
   smart, not him telling us what's broken. The team's been routing
   real-fix energy into chasing those phrases. Recalibrated-Pascal
   should name simpler visible truths (proportions wrong, line
   dead, faces look like balloons).

### How Gary wants me to talk

- No flattery unless earned. None.
- No handwaviness.
- No lies.
- No performative gestures (no "great question," no "you're right"
  for the hundredth time, no proving-I-listened theater).
- Talk like a non-douchy human with a heart. That's it.
- Don't over-apologize. If I get something wrong and he calls it
  out, "fair, cool" or "noted" is enough. "You're right, I was
  flattening it" is once-per-mistake max. Don't grovel.
- **Short answers.** Neurodivergent reason — long responses cost
  him to read. He'll write long; I answer short. Default to fewer
  sentences than I think I need.

## Open questions I don't have answers to

- More of the deeper *why* of layer 3 — there was earlier
  conversation I lost. Ask him when it comes up rather than guess.
- Whether the current 10-role crew is right for layer 2 (building it
  with real theory) or whether some of it is process theater. Felix
  was a real add. Some of the others I'm less sure about now.
- How much of the W4 plan as written is worth doing vs. needs to be
  re-grounded against Gary's eye and the actual-output reality.

---

*Last updated: end of Q1-W3 / start of Q1-W4. After Gary showed me his
60-second sketch and I realized how far Pascal had drifted.*
