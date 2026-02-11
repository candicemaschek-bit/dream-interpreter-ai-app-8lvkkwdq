/**
 * AI Task Suggestions Utility
 * Generates AI-suggested steps for admin tasks to ensure nothing important is missed
 */

import { blink } from '../blink/client';

export interface TaskSuggestion {
  step: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours?: number;
}

export interface AITaskSuggestionsResult {
  suggestions: TaskSuggestion[];
  reasoning: string;
  totalEstimatedHours: number;
}

/**
 * Generate AI suggestions for a given task
 * @param title - Task title
 * @param description - Task description
 * @param priority - Task priority
 * @returns AI-generated suggestions with reasoning
 */
export async function generateTaskSuggestions(
  title: string,
  description: string,
  priority: 'high' | 'medium' | 'low'
): Promise<AITaskSuggestionsResult> {
  try {
    const prompt = `As an experienced project manager and software architect, analyze the following admin task and provide detailed step-by-step suggestions to ensure nothing important is missed.

**Task Title:** ${title}
**Task Description:** ${description}
**Task Priority:** ${priority}

Please provide:
1. A list of specific, actionable steps required to complete this task
2. For each step, include:
   - The step description
   - A brief explanation of why it's important
   - Priority level (high/medium/low)
   - Estimated hours to complete
3. Overall reasoning about the approach
4. Any potential risks or dependencies to consider

Format your response as a structured JSON object with the following schema:
{
  "suggestions": [
    {
      "step": "Step title",
      "description": "Detailed description of what needs to be done and why",
      "priority": "high|medium|low",
      "estimatedHours": number
    }
  ],
  "reasoning": "Overall approach and rationale",
  "totalEstimatedHours": number,
  "risks": ["Potential risk 1", "Potential risk 2"]
}

Ensure suggestions are:
- Specific and actionable (not vague)
- Ordered logically (dependencies first)
- Complete (cover all aspects of the task)
- Realistic (achievable steps)
- Include testing and documentation where appropriate`;

    const { object } = await blink.ai.generateObject({
      prompt,
      schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                estimatedHours: { type: 'number' }
              },
              required: ['step', 'description', 'priority']
            }
          },
          reasoning: { type: 'string' },
          totalEstimatedHours: { type: 'number' },
          risks: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['suggestions', 'reasoning', 'totalEstimatedHours']
      }
    });

    return {
      suggestions: object.suggestions as TaskSuggestion[],
      reasoning: object.reasoning as string,
      totalEstimatedHours: object.totalEstimatedHours as number
    };
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    
    // Return fallback suggestions
    return {
      suggestions: [
        {
          step: 'Plan implementation approach',
          description: 'Review requirements and create detailed implementation plan',
          priority: 'high',
          estimatedHours: 2
        },
        {
          step: 'Implement core functionality',
          description: 'Build the main features according to specifications',
          priority: 'high',
          estimatedHours: 8
        },
        {
          step: 'Write tests',
          description: 'Create unit and integration tests for reliability',
          priority: 'medium',
          estimatedHours: 3
        },
        {
          step: 'Review and refine',
          description: 'Code review, refactoring, and optimization',
          priority: 'medium',
          estimatedHours: 2
        },
        {
          step: 'Update documentation',
          description: 'Document changes, API updates, and usage examples',
          priority: 'low',
          estimatedHours: 1
        }
      ],
      reasoning: 'Using fallback suggestions due to AI generation error. These are generic best practices for software development tasks.',
      totalEstimatedHours: 16
    };
  }
}

/**
 * Format suggestions as markdown for display
 */
export function formatSuggestionsAsMarkdown(result: AITaskSuggestionsResult): string {
  let markdown = `## AI-Suggested Implementation Steps\n\n`;
  markdown += `**Reasoning:** ${result.reasoning}\n\n`;
  markdown += `**Total Estimated Hours:** ${result.totalEstimatedHours}h\n\n`;
  markdown += `### Steps:\n\n`;

  result.suggestions.forEach((suggestion, index) => {
    const priorityEmoji = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    }[suggestion.priority];

    markdown += `${index + 1}. **${suggestion.step}** ${priorityEmoji}\n`;
    markdown += `   - ${suggestion.description}\n`;
    if (suggestion.estimatedHours) {
      markdown += `   - Estimated: ${suggestion.estimatedHours}h\n`;
    }
    markdown += `\n`;
  });

  return markdown;
}

/**
 * Append suggestions to task description
 */
export function appendSuggestionsToDescription(
  originalDescription: string,
  result: AITaskSuggestionsResult
): string {
  const suggestionsMarkdown = formatSuggestionsAsMarkdown(result);
  
  return `${originalDescription}\n\n---\n\n${suggestionsMarkdown}`;
}
