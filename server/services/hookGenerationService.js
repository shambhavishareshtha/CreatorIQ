const clean = (value, fallback) => String(value || fallback).trim();
const words = value => clean(value, '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);

export function generateHooks(input = {}, options = {}) {
  const platform = clean(input.platform, 'Instagram');
  const niche = clean(input.niche, 'your creative practice');
  const audience = clean(input.audience, 'people finding their way');
  const format = clean(input.format, 'short video');
  const objective = clean(input.objective, 'engagement');
  const tone = clean(input.tone, 'conversational');
  const reference = clean(input.reference, '');
  const seed = Number(options.seed ?? input.seed ?? 0) >>> 0;
  const patterns = [
    { angle: 'Specific tension', hook: `The part of ${niche} nobody mentions when you’re starting out…`, opening: `Name the moment that made this real for you.`, idea: `Share one practical lesson for ${audience}.`, cta: 'What part are you figuring out right now?' },
    { angle: 'A small before-and-after', hook: `I changed one small thing in my ${niche} routine. Here’s what shifted.`, opening: `Show the old way for a beat, then the new one.`, idea: `Walk through the change without promising the same result for everyone.`, cta: 'Save this if you want to try the process.' },
    { angle: 'Useful myth-busting', hook: `You don’t need to have ${niche} completely figured out to begin.`, opening: `Lead with the advice you wish you had heard.`, idea: `Offer a clear first step that helps ${audience} move forward.`, cta: 'Send this to someone who needs a gentler starting point.' },
    { angle: 'An open question', hook: `What if the next step in ${niche} is smaller than you think?`, opening: `Pause on the question, then give one grounded example.`, idea: `Connect a simple action to the objective of ${objective}.`, cta: 'Tell me which small step you’ll take.' },
    { angle: 'Process, not polish', hook: `Here’s the unpolished middle of making something in ${niche}.`, opening: `Start with a real work-in-progress detail.`, idea: `Show the decisions and trade-offs behind the finished work.`, cta: 'Would you like to see the next step?' },
  ];
  const offset = seed % patterns.length;
  const shuffled = patterns.slice(offset).concat(patterns.slice(0, offset));
  const audienceNoun = words(audience).slice(0, 3).join(' ');
  const toneTag = `${tone.toLowerCase()}${platform === 'X' ? ' text-first' : ''}`;
  const suggestions = shuffled.slice(0, 4).map((item, index) => ({
    id: `hook-${seed}-${index}`,
    ...item,
    hook: index === 0 && reference ? `${reference.slice(0, 180)} — what changed the way you see ${niche}?` : index === 2 && audienceNoun ? item.hook.replace(audience, audienceNoun) : item.hook,
    explanation: `${item.angle} angle, shaped for ${format.toLowerCase()} in a ${toneTag} tone, working toward the ${objective.toLowerCase()} goal.`,
    evidence: options.evidence || null,
    evidenceLabel: options.evidence ? 'Performance-informed suggestion · directional evidence' : 'Exploratory suggestion · no sufficient historical data',
  }));
  return { suggestions, source: 'deterministic', personalizedBy: { platform, niche, audience, format, objective, tone }, exploratory: !options.evidence };
}
