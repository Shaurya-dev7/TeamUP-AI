export function parseSkills(skills: string | undefined | null) {
  return (skills || '')
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function scoreProfilesBySkillOverlap(userSkills: string[], profiles: Array<any>) {
  const scored = (profiles || []).map((p: any) => {
    const theirSkills = parseSkills(p.skills);
    const overlap = theirSkills.filter((s) => userSkills.includes(s));
    return { ...p, score: overlap.length };
  });

  return scored.filter((p) => p.score > 0);
}

export function topByScore(scored: Array<any>, top_n = 10) {
  return scored.sort((a, b) => b.score - a.score).slice(0, top_n);
}
