# Kindle pilot plan

No pilot has been run. This file is the plan, not a result. The ship decision from observed behavior is **not ready to call**, because there is no observed behavior yet.

## Who

10 to 30 adults who already make plans in a group chat. One existing friend circle is enough. Do not recruit strangers, and do not include anyone under 18. Kindle only records an 18+ attestation. It does not verify age.

## What they do

1. Each person saves a profile on one shared Kindle server, or on their own machine if the pilot stays local.
2. One person creates "basketball tonight" or the real plan they were about to put in chat.
3. They send the friend link themselves. Kindle will not message anyone.
4. Friends accept, tap I'm in or Can't go, and only the people who are in see the exact spot.
5. A week later, ask who made a second plan.

## What to write down

- Did a plan reach 3 people marked in within 24 hours? The server can count this with `serverSnapshot` in `src/lib/metrics.ts`. That function reads this database. It is not a public dashboard and it is not traction.
- Did someone who joined later host a plan?
- Where did people go back to the group chat, and why?
- Did anyone see a spot, a name, or a plan they should not have seen?

## Decision

- **Ship a wider build** only if several circles repeat a plan without being prompted, and nobody reports a privacy leak.
- **Iterate** if people can finish one plan but still prefer chat for the next one.
- **Stop** if the first circles do not complete a single plan, or if the exact spot leaks.

Until those notes exist, Kindle stays a local working build.
