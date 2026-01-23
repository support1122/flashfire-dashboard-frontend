export function capitalizeWords(text: string): string {
    if (!text) return "";
    return text
        .split(/\s+/)
        .map(word => {
            if (!word) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}

export function capitalizeSkillsString(skillsString: string): string {
    if (!skillsString) return "";
    return skillsString
        .split(",")
        .map(skill => {
            const trimmed = skill.trim();
            if (!trimmed) return trimmed;
            return capitalizeWords(trimmed);
        })
        .join(", ");
}

export function capitalizeSkillsArray(skills: Array<{ category?: string; skills: string }>): Array<{ category?: string; skills: string }> {
    if (!skills || !Array.isArray(skills)) return skills;
    return skills.map(skill => ({
        ...skill,
        category: skill.category ? capitalizeWords(skill.category) : skill.category,
        skills: capitalizeSkillsString(skill.skills)
    }));
}
