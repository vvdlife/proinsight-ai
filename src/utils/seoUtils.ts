
export interface SeoMetrics {
    wordCount: number;
    charCount: number;
    h2Count: number;
    linkCount: number;
    imageCount: number;
    keywordCount: number;
    keywordDensity: number;
    inTitle: boolean;
    inFirstPara: boolean;
}

export interface SeoScores {
    total: number;
    length: number;
    structure: number;
    keyword: number;
    quality: number;
}

export const calculateSeoMetrics = (
    content: string,
    title: string,
    keyword: string = ''
): SeoMetrics => {
    const wordCount = content.replace(/#/g, '').trim().split(/\s+/).length;
    const charCount = content.replace(/\s/g, '').length;
    const h2Count = (content.match(/^##\s?/gm) || []).length;
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;

    let keywordCount = 0;
    let keywordDensity = 0;
    let inTitle = false;
    let inFirstPara = false;

    if (keyword) {
        // Escape regex special characters
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKeyword, 'gi');
        const matches = content.match(regex);
        keywordCount = matches ? matches.length : 0;
        keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
        inTitle = title.includes(keyword);

        const firstPara = content.slice(0, 300);
        inFirstPara = firstPara.includes(keyword);
    }

    return {
        wordCount, charCount, h2Count, linkCount, imageCount,
        keywordCount, keywordDensity, inTitle, inFirstPara
    };
};

export const calculateSeoScores = (
    metrics: SeoMetrics,
    keyword: string,
    suggestionCount: number
): SeoScores => {
    // A. Content Length (20 pts)
    let lengthScore = 0;
    if (metrics.charCount >= 1500) lengthScore = 20;
    else lengthScore = Math.round((metrics.charCount / 1500) * 20);

    // B. Structure (20 pts)
    let structureScore = 0;
    structureScore += Math.min((metrics.h2Count / 3) * 10, 10);
    structureScore += Math.min((metrics.imageCount / 1) * 5, 5);
    structureScore += Math.min((metrics.linkCount / 1) * 5, 5);

    // C. Keyword Optimization (40 pts)
    let keywordScore = 0;
    if (keyword) {
        if (metrics.inTitle) keywordScore += 15;
        if (metrics.inFirstPara) keywordScore += 10;
        // Density 0.5% ~ 3.0% = 15pts
        if (metrics.keywordDensity >= 0.5 && metrics.keywordDensity <= 3.0) keywordScore += 15;
        else if (metrics.keywordDensity > 0 && metrics.keywordDensity < 0.5) keywordScore += 5;
        else if (metrics.keywordDensity > 3.0) keywordScore += 5;
    } else {
        // Fallback: Redistribute
        lengthScore = Math.min(lengthScore * 1.5, 30);
        structureScore = Math.min(structureScore * 2, 40);
    }

    // D. Quality & AI (20 pts)
    let qualityScore = 20;
    if (suggestionCount > 0) {
        qualityScore = Math.max(0, 20 - (suggestionCount * 5));
    }

    const total = Math.min(Math.round(lengthScore + structureScore + keywordScore + qualityScore), 100);

    return { total, length: lengthScore, structure: structureScore, keyword: keywordScore, quality: qualityScore };
};
