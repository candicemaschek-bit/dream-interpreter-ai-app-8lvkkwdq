import { ParsedInterpretation, InterpretationSection } from '../types/dream';

/**
 * Enhanced parsed interpretation with additional fields for ReflectAI
 */
export interface EnhancedParsedInterpretation extends ParsedInterpretation {
  keySymbols?: string[];
  emotionalThemes?: string;
  lifeConnections?: string;
}

/**
 * Parses dream interpretation into structured sections and splits guidance from reflection prompts
 */
export function parseInterpretation(interpretation: string): ParsedInterpretation {
  // Validate input
  if (!interpretation || typeof interpretation !== 'string' || interpretation.trim().length === 0) {
    console.warn('parseInterpretation: Invalid or empty interpretation received');
    return {
      sections: [],
      guidanceContent: '',
      reflectionPrompts: [],
      overallMeaning: ''
    };
  }
  
  const sections = extractSections(interpretation);
  
  // If no sections found, create a single "Overall Meaning" section with the entire interpretation
  if (sections.length === 0) {
    console.log('parseInterpretation: No structured sections found, using raw interpretation');
    return {
      sections: [{
        type: 'section',
        sectionNumber: '1',
        title: 'Dream Interpretation',
        content: interpretation.trim()
      }],
      guidanceContent: interpretation.trim(),
      reflectionPrompts: [],
      overallMeaning: interpretation.trim()
    };
  }
  
  const guidanceSection = sections.find(s => s.title.toLowerCase().includes('guidance'));
  
  // Split guidance content from reflection prompts
  const { guidance, reflectionPrompts } = splitGuidanceAndReflections(guidanceSection?.content || '');
  
  // Update the guidance section to contain only guidance content
  const parsedSections = sections.map(section => {
    if (section.title.toLowerCase().includes('guidance')) {
      return {
        ...section,
        content: guidance || section.content
      };
    }
    return section;
  });

  // Extract overall meaning from first section
  const overallMeaningSection = sections.find(s => 
    s.title.toLowerCase().includes('overall') || 
    s.title.toLowerCase().includes('meaning') ||
    s.sectionNumber === '1'
  );

  // Extract key symbols section
  const symbolsSection = sections.find(s => 
    s.title.toLowerCase().includes('symbol') ||
    s.sectionNumber === '2'
  );
  
  // Extract emotional themes section
  const emotionalSection = sections.find(s => 
    s.title.toLowerCase().includes('emotion') ||
    s.title.toLowerCase().includes('theme') ||
    s.sectionNumber === '3'
  );
  
  // Extract life connections section
  const lifeSection = sections.find(s => 
    s.title.toLowerCase().includes('life') ||
    s.title.toLowerCase().includes('connection') ||
    s.sectionNumber === '4'
  );

  // Extract individual symbols from the symbols section
  const keySymbols = symbolsSection ? extractKeySymbols(symbolsSection.content) : [];

  return {
    sections: parsedSections,
    guidanceContent: guidance || (guidanceSection?.content || ''),
    reflectionPrompts: reflectionPrompts,
    overallMeaning: overallMeaningSection?.content || '',
    keySymbols,
    emotionalThemes: emotionalSection?.content || '',
    lifeConnections: lifeSection?.content || '',
    guidance
  } as EnhancedParsedInterpretation;
}

/**
 * Extracts individual symbols from the key symbols section content
 */
function extractKeySymbols(content: string): string[] {
  const symbols: string[] = [];
  
  // Pattern 1: Bold symbols like **Water** or *Water*
  const boldMatches = content.match(/\*\*([^*]+)\*\*|\*([^*]+)\*/g);
  if (boldMatches) {
    boldMatches.forEach(match => {
      const clean = match.replace(/\*/g, '').trim();
      if (clean && clean.length < 50) {
        symbols.push(clean);
      }
    });
  }
  
  // Pattern 2: Symbols followed by colon like "Water:" or "The Water:"
  const colonMatches = content.match(/(?:The\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*:/g);
  if (colonMatches) {
    colonMatches.forEach(match => {
      const clean = match.replace(/^The\s+/, '').replace(/:$/, '').trim();
      if (clean && clean.length < 30 && !symbols.includes(clean)) {
        symbols.push(clean);
      }
    });
  }
  
  // Pattern 3: Bullet points or numbered items
  const bulletMatches = content.match(/(?:^|\n)[•\-*]\s*([A-Z][^:\n]{2,30})(?:[:|\n])/g);
  if (bulletMatches) {
    bulletMatches.forEach(match => {
      const clean = match.replace(/^[•\-*\n]\s*/, '').replace(/[:|\n]$/, '').trim();
      if (clean && clean.length < 30 && !symbols.includes(clean)) {
        symbols.push(clean);
      }
    });
  }
  
  return symbols.slice(0, 8); // Return max 8 symbols
}

/**
 * Extracts numbered sections from interpretation text
 * Enhanced with multiple fallback patterns for reliable parsing
 */
function extractSections(interpretation: string): InterpretationSection[] {
  const sections: InterpretationSection[] = [];
  const text = interpretation.trim();
  
  // PATTERN 1: Match "1. Title" or "1. **Title**" format (most common from AI)
  const numberedPattern = /(?:^|\n)(\d+)\.\s*\*?\*?([^\n*:]+)\*?\*?:?\s*([\s\S]*?)(?=(?:\n\d+\.\s)|$)/gi;
  let match;
  
  while ((match = numberedPattern.exec(text)) !== null) {
    const [, sectionNum, title, content] = match;
    const cleanTitle = title.replace(/\*\*/g, '').replace(/[*#]/g, '').trim();
    const cleanContent = content.trim();
    
    if (cleanTitle && cleanContent && cleanContent.length > 10) {
      // Avoid duplicates
      const exists = sections.some(s => s.sectionNumber === sectionNum);
      if (!exists) {
        sections.push({
          type: 'section',
          sectionNumber: sectionNum,
          title: cleanTitle,
          content: cleanContent
        });
      }
    }
  }
  
  // If we found sections, return them sorted by number
  if (sections.length > 0) {
    return sections.sort((a, b) => parseInt(a.sectionNumber) - parseInt(b.sectionNumber));
  }
  
  // PATTERN 2: Match markdown headers ### 1. Title or ## Title format
  const headerPattern = /(?:^|\n)#{1,3}\s*(\d+)?\.*\s*([^\n#]+)([\s\S]*?)(?=(?:\n#{1,3}\s)|$)/gi;
  
  let sectionCounter = 1;
  while ((match = headerPattern.exec(text)) !== null) {
    const [, sectionNum, title, content] = match;
    const cleanTitle = title.replace(/\*\*/g, '').replace(/[*#]/g, '').trim();
    const cleanContent = content.trim();
    
    if (cleanTitle && cleanContent && cleanContent.length > 10) {
      sections.push({
        type: 'section',
        sectionNumber: sectionNum || String(sectionCounter),
        title: cleanTitle,
        content: cleanContent
      });
      sectionCounter++;
    }
  }
  
  if (sections.length > 0) {
    return sections;
  }
  
  // PATTERN 3: Fallback - split by double newlines and look for section-like structures
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 20);
  
  if (paragraphs.length > 1) {
    paragraphs.forEach((para, index) => {
      // Check if paragraph starts with a number or title-like structure
      const titleMatch = para.match(/^(\d+\.\s*)?([A-Z][^.\n]{3,50})(?:[:\n]|$)/);
      if (titleMatch) {
        const title = titleMatch[2].trim();
        const content = para.substring(titleMatch[0].length).trim();
        if (content.length > 20) {
          sections.push({
            type: 'section',
            sectionNumber: String(index + 1),
            title: title,
            content: content
          });
        }
      }
    });
  }
  
  return sections;
}

/**
 * Splits guidance content from reflection prompts in section 5
 */
function splitGuidanceAndReflections(content: string): { guidance: string; reflectionPrompts: string[] } {
  const prompts = [];
  let guidance = content;
  
  // Find reflection prompt patterns
  const promptPatterns = [
    /Consider the following questions:[\s\S]*$/i,
    /Reflection questions:[\s\S]*$/i,
    /Questions for deeper understanding:[\s\S]*$/i,
    /Take a moment to reflect:[\s\S]*$/i,
    /Journaling prompts:[\s\S]*$/i,
    /For personal reflection:[\s\S]*$/i
  ];
  
  for (const pattern of promptPatterns) {
    const match = content.match(pattern);
    if (match) {
      const index = match.index;
      guidance = content.substring(0, index).trim();
      
      // Extract individual prompts from the matched section
      const promptSection = match[0];
      const individualPrompts = promptSection.match(/\d+\. [^•\n]+|[•\-*]\s+[^•\n]+|Questions?[:\s]*[^•\n]+/gi);
      
      if (individualPrompts) {
        prompts.push(...individualPrompts.map(p => p.replace(/^\d+\.\s*|^[•\-*]\s*|Questions?[:\s]*/i, '').trim()));
      }
      break;
    }
  }
  
  // If no specific prompt section found, try to extract question-like sentences
  if (prompts.length === 0) {
    // Only treat content as prompts if it contains actual questions.
    const questionSentences = content
      .split(/(?<=\?)\s+/)
      .map((s) => s.trim())
      .filter((s) => s.includes('?') && s.length > 0)

    if (questionSentences.length > 0) {
      const lastThreeQuestions = questionSentences.slice(-3)
      prompts.push(...lastThreeQuestions)

      // Remove the extracted question prompts from the end of guidance if they appear there.
      const lastQuestion = lastThreeQuestions[lastThreeQuestions.length - 1]
      const idx = content.lastIndexOf(lastQuestion)
      if (idx > 0) {
        guidance = content.substring(0, idx).trim()
      }
    }
  }
  
  return { guidance, reflectionPrompts: prompts };
}

/**
 * Generates a summary of a dream for reflection journaling
 */
export function generateDreamSummary(title: string, description: string): string {
  // Add validation to prevent substring errors on undefined/null values
  if (!title || typeof title !== 'string') {
    title = 'Untitled Dream'
  }
  if (!description || typeof description !== 'string') {
    description = 'No description available'
  }
  
  return `Dream: "${title}" - ${description.substring(0, 150)}${description.length > 150 ? '...' : ''}`;
}