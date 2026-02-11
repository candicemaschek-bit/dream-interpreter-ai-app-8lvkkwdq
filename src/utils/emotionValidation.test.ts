import { describe, it, expect } from 'vitest'
import {
  validateEmotionalContent,
  categorizeEmotions,
  getEmotionSuggestions
} from './emotionValidation'

describe('emotionValidation', () => {
  describe('validateEmotionalContent', () => {
    it('should accept text with positive emotions', () => {
      const result = validateEmotionalContent('I felt happy and joyful in my dream')
      expect(result.isValid).toBe(true)
      expect(result.detectedEmotions.length).toBeGreaterThan(0)
    })

    it('should accept text with negative emotions', () => {
      const result = validateEmotionalContent('I was scared and anxious during the nightmare')
      expect(result.isValid).toBe(true)
      expect(result.detectedEmotions.length).toBeGreaterThan(0)
    })

    it('should accept text with neutral emotions', () => {
      const result = validateEmotionalContent('I felt confused and overwhelmed by the dream')
      expect(result.isValid).toBe(true)
      expect(result.detectedEmotions.length).toBeGreaterThan(0)
    })

    it('should accept text with complex emotions', () => {
      const result = validateEmotionalContent('I felt vulnerable and powerful at the same time')
      expect(result.isValid).toBe(true)
      expect(result.detectedEmotions.length).toBeGreaterThan(0)
    })

    it('should reject empty text', () => {
      const result = validateEmotionalContent('')
      expect(result.isValid).toBe(false)
      expect(result.suggestionMessage).toContain('Please provide')
    })

    it('should reject null/undefined text', () => {
      const result = validateEmotionalContent(null as any)
      expect(result.isValid).toBe(false)
    })

    it('should reject whitespace-only text', () => {
      const result = validateEmotionalContent('   \n\t  ')
      expect(result.isValid).toBe(false)
    })

    it('should reject text shorter than 20 characters without emotions', () => {
      const result = validateEmotionalContent('I had a short dream')
      expect(result.isValid).toBe(false)
      expect(result.suggestionMessage).toContain('more details')
    })

    it('should still require minimum 20 characters even with emotions', () => {
      const result = validateEmotionalContent('I felt very happy')
      // Text is only 16 characters, below 20 minimum
      expect(result.isValid).toBe(false)
      expect(result.suggestionMessage).toContain('more details')
    })

    it('should accept text with emotional context phrases', () => {
      const result = validateEmotionalContent('I felt like I was flying through the sky')
      expect(result.isValid).toBe(true)
    })

    it('should accept "i was feeling" phrase', () => {
      const result = validateEmotionalContent('i was feeling anxious and concerned about the situation')
      expect(result.isValid).toBe(true)
    })

    it('should accept "it felt" phrase', () => {
      const result = validateEmotionalContent('it felt like the ground was shaking and I was terrified')
      expect(result.isValid).toBe(true)
    })

    it('should accept "made me feel" phrase', () => {
      const result = validateEmotionalContent('the situation made me feel depressed and hopeless')
      expect(result.isValid).toBe(true)
    })

    it('should reject text without emotional content or phrases', () => {
      const result = validateEmotionalContent('I walked down a street and saw some buildings and trees')
      expect(result.isValid).toBe(false)
      expect(result.suggestionMessage?.toLowerCase()).toContain('felt')
    })

    it('should detect multiple emotions', () => {
      const result = validateEmotionalContent('I felt happy at first, then scared, and finally confused')
      expect(result.emotionCount).toBeGreaterThanOrEqual(3)
    })

    it('should handle case-insensitive emotion detection', () => {
      const resultLower = validateEmotionalContent('i felt HAPPY and EXCITED')
      const resultUpper = validateEmotionalContent('I FELT happy AND excited')
      expect(resultLower.isValid).toBe(true)
      expect(resultUpper.isValid).toBe(true)
    })

    it('should detect "joy" emotion', () => {
      const result = validateEmotionalContent('The dream filled me with joy and delight')
      expect(result.detectedEmotions).toContain('joy')
    })

    it('should detect "fear" emotion', () => {
      const result = validateEmotionalContent('I had intense fear during the nightmare')
      expect(result.detectedEmotions).toContain('fear')
    })

    it('should detect "excited" emotion', () => {
      const result = validateEmotionalContent('I was excited and pumped about the adventure')
      expect(result.detectedEmotions).toContain('excited')
    })

    it('should detect "sad" emotion', () => {
      const result = validateEmotionalContent('I felt sad and alone in this dream')
      expect(result.detectedEmotions).toContain('sad')
    })

    it('should require minimum 20 characters with emotion keywords', () => {
      // Text with emotion keyword but need enough characters
      const result = validateEmotionalContent('I was afraid in the dream and then everything became clear and vivid')
      // "afraid" is detected, text is >20 chars
      expect(result.isValid).toBe(true)
      expect(result.emotionCount).toBeGreaterThan(0)
    })

    it('should detect "desperate" emotion', () => {
      const result = validateEmotionalContent('I felt desperate and trapped in the dream')
      expect(result.detectedEmotions).toContain('desperate')
    })

    it('should detect "nostalgic" emotion', () => {
      const result = validateEmotionalContent('I felt nostalgic remembering old times')
      expect(result.detectedEmotions).toContain('nostalgic')
    })

    it('should provide suggestion message when emotions missing', () => {
      const result = validateEmotionalContent('I walked through a house with many rooms')
      expect(result.isValid).toBe(false)
      expect(result.suggestionMessage).toBeDefined()
      expect(result.suggestionMessage).toContain('felt')
    })

    it('should handle very long emotional text', () => {
      const longText = 'I felt happy and content. ' + 'I was joyful. '.repeat(100)
      const result = validateEmotionalContent(longText)
      expect(result.isValid).toBe(true)
      expect(result.emotionCount).toBeGreaterThan(0)
    })

    it('should accept "angry" emotion', () => {
      const result = validateEmotionalContent('I was very angry during the confrontation')
      expect(result.detectedEmotions).toContain('angry')
    })

    it('should detect "peaceful" emotion', () => {
      const result = validateEmotionalContent('I felt peaceful and serene in the garden')
      expect(result.detectedEmotions).toContain('peaceful')
    })
  })

  describe('categorizeEmotions', () => {
    it('should categorize positive emotions', () => {
      const emotions = ['happy', 'joy', 'excited', 'grateful']
      const result = categorizeEmotions(emotions)
      expect(result.positive).toContain('happy')
      expect(result.positive).toContain('joy')
      expect(result.positive).toContain('excited')
    })

    it('should categorize negative emotions', () => {
      const emotions = ['sad', 'angry', 'afraid', 'anxious']
      const result = categorizeEmotions(emotions)
      expect(result.negative).toContain('sad')
      expect(result.negative).toContain('angry')
      expect(result.negative).toContain('afraid')
    })

    it('should categorize neutral emotions', () => {
      const emotions = ['confused', 'surprised', 'uncertain']
      const result = categorizeEmotions(emotions)
      expect(result.neutral).toContain('confused')
      expect(result.neutral).toContain('surprised')
    })

    it('should categorize complex emotions', () => {
      const emotions = ['vulnerable', 'powerful', 'trapped', 'free']
      const result = categorizeEmotions(emotions)
      expect(result.complex).toContain('vulnerable')
      expect(result.complex).toContain('powerful')
    })

    it('should handle empty emotion list', () => {
      const result = categorizeEmotions([])
      expect(result.positive).toEqual([])
      expect(result.negative).toEqual([])
      expect(result.neutral).toEqual([])
      expect(result.complex).toEqual([])
    })

    it('should handle mixed emotions', () => {
      const emotions = ['happy', 'sad', 'confused', 'powerful']
      const result = categorizeEmotions(emotions)
      expect(result.positive).toContain('happy')
      expect(result.negative).toContain('sad')
      expect(result.neutral).toContain('confused')
      expect(result.complex).toContain('powerful')
    })

    it('should handle unknown emotions gracefully', () => {
      const emotions = ['happy', 'unknownemotion', 'sad']
      const result = categorizeEmotions(emotions)
      expect(result.positive).toContain('happy')
      expect(result.negative).toContain('sad')
    })

    it('should handle duplicate emotions', () => {
      const emotions = ['happy', 'happy', 'sad', 'sad']
      const result = categorizeEmotions(emotions)
      // Should include duplicates as they were provided
      expect(result.positive.length).toBeGreaterThanOrEqual(2)
    })

    it('should maintain emotion order', () => {
      const emotions = ['excited', 'happy', 'grateful']
      const result = categorizeEmotions(emotions)
      const firstPositive = result.positive[0]
      expect(['excited', 'happy', 'grateful']).toContain(firstPositive)
    })

    it('should detect "elated" as positive', () => {
      const result = categorizeEmotions(['elated'])
      expect(result.positive).toContain('elated')
    })

    it('should detect "terrified" as negative', () => {
      const result = categorizeEmotions(['terrified'])
      expect(result.negative).toContain('terrified')
    })

    it('should detect "nostalgic" as neutral', () => {
      const result = categorizeEmotions(['nostalgic'])
      expect(result.neutral).toContain('nostalgic')
    })

    it('should detect "weak" as complex', () => {
      const result = categorizeEmotions(['weak'])
      expect(result.complex).toContain('weak')
    })

    it('should handle all emotion categories together', () => {
      const emotions = [
        'happy', 'sad', 'confused', 'vulnerable',
        'joy', 'fear', 'surprised', 'powerful'
      ]
      const result = categorizeEmotions(emotions)
      expect(result.positive.length).toBeGreaterThan(0)
      expect(result.negative.length).toBeGreaterThan(0)
      expect(result.neutral.length).toBeGreaterThan(0)
      expect(result.complex.length).toBeGreaterThan(0)
    })
  })

  describe('getEmotionSuggestions', () => {
    it('should return array of suggestions', () => {
      const suggestions = getEmotionSuggestions('I had a dream')
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return up to 3 suggestions', () => {
      const suggestions = getEmotionSuggestions('I had a very detailed and long dream about many things')
      expect(suggestions.length).toBeLessThanOrEqual(3)
    })

    it('should provide chase-related suggestion for chase text', () => {
      const suggestions = getEmotionSuggestions('I was being chased through the forest')
      expect(suggestions.some(s => s.toLowerCase().includes('afraid') || s.toLowerCase().includes('scared') || s.toLowerCase().includes('chase'))).toBe(true)
    })

    it('should provide run-related suggestion for run text', () => {
      const suggestions = getEmotionSuggestions('I was running as fast as I could')
      expect(suggestions.some(s => s.toLowerCase().includes('afraid') || s.toLowerCase().includes('scared') || s.toLowerCase().includes('run'))).toBe(true)
    })

    it('should provide fall-related suggestion for fall text', () => {
      const suggestions = getEmotionSuggestions('I was falling from a tall building')
      expect(suggestions.some(s => s.toLowerCase().includes('scared') || s.toLowerCase().includes('helpless') || s.toLowerCase().includes('fall'))).toBe(true)
    })

    it('should provide falling-related suggestion for falling text', () => {
      const suggestions = getEmotionSuggestions('I kept falling deeper and deeper')
      expect(suggestions.some(s => s.toLowerCase().includes('scared') || s.toLowerCase().includes('helpless'))).toBe(true)
    })

    it('should provide fly-related suggestion for fly text', () => {
      const suggestions = getEmotionSuggestions('I was flying through the sky')
      expect(suggestions.some(s => s.toLowerCase().includes('free') || s.toLowerCase().includes('joyful') || s.toLowerCase().includes('powerful') || s.toLowerCase().includes('fly'))).toBe(true)
    })

    it('should provide flying-related suggestion for flying text', () => {
      const suggestions = getEmotionSuggestions('I was flying over mountains and clouds')
      expect(suggestions.some(s => s.toLowerCase().includes('free') || s.toLowerCase().includes('joyful') || s.toLowerCase().includes('flying'))).toBe(true)
    })

    it('should handle case-insensitive context detection', () => {
      const suggestionsUpper = getEmotionSuggestions('I WAS CHASING SOMEONE')
      const suggestionsLower = getEmotionSuggestions('i was chasing someone')
      expect(suggestionsUpper.length).toBeGreaterThan(0)
      expect(suggestionsLower.length).toBeGreaterThan(0)
    })

    it('should provide default suggestions for generic text', () => {
      const suggestions = getEmotionSuggestions('I had a dream about a house')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toBeDefined()
    })

    it('should handle empty string', () => {
      const suggestions = getEmotionSuggestions('')
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should include "How did you feel" style suggestion', () => {
      const suggestions = getEmotionSuggestions('I had a dream')
      const hasFeelQuestion = suggestions.some(s => 
        s.toLowerCase().includes('feel') || s.toLowerCase().includes('emotion')
      )
      expect(hasFeelQuestion).toBe(true)
    })

    it('should provide relevant suggestions for multiple keywords', () => {
      const suggestions = getEmotionSuggestions('I was falling and then chasing someone while flying')
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should maintain suggestion count limit', () => {
      const longText = 'I was chasing and falling and flying ' + 'while being scared '.repeat(50)
      const suggestions = getEmotionSuggestions(longText)
      expect(suggestions.length).toBeLessThanOrEqual(3)
    })

    it('should prioritize specific context suggestions', () => {
      const chaseSuggestions = getEmotionSuggestions('I was being chased')
      const flySuggestions = getEmotionSuggestions('I was flying')
      // Both should have suggestions, but they should differ
      expect(chaseSuggestions.length).toBeGreaterThan(0)
      expect(flySuggestions.length).toBeGreaterThan(0)
    })

    it('should throw for null/undefined input', () => {
      // Function expects a string, throws on null/undefined
      expect(() => getEmotionSuggestions(null as any)).toThrow()
    })
  })

  describe('emotion detection edge cases', () => {
    it('should handle dream with multiple sentence structure', () => {
      const text = 'I was in a forest. I felt scared. Then I felt happy. The dream was vivid.'
      const result = validateEmotionalContent(text)
      expect(result.isValid).toBe(true)
      expect(result.emotionCount).toBeGreaterThanOrEqual(2)
    })

    it('should handle dream with punctuation around emotions', () => {
      const text = 'I felt (happy), [excited], and {peaceful} throughout the dream'
      const result = validateEmotionalContent(text)
      expect(result.isValid).toBe(true)
    })

    it('should handle dream with contractions', () => {
      const text = "I wasn't scared, I was excited about what I'd discovered"
      const result = validateEmotionalContent(text)
      expect(result.isValid).toBe(true)
    })

    it('should handle dream with numbers and emotions', () => {
      const text = 'I had 5 different dreams where I felt happy, scared, and confused'
      const result = validateEmotionalContent(text)
      expect(result.isValid).toBe(true)
    })

    it('should handle hyphenated emotions', () => {
      const text = 'I felt scared-happy and overwhelmed-excited'
      const result = validateEmotionalContent(text)
      expect(result.isValid).toBe(true)
    })

    it('should detect emotions with different verb forms', () => {
      const text = 'I was feeling sad, scared, and confused'
      const result = validateEmotionalContent(text)
      expect(result.emotionCount).toBeGreaterThanOrEqual(2)
    })

    it('should require minimum 20 characters even with strong emotion keywords', () => {
      const text = 'I felt love'
      const result = validateEmotionalContent(text)
      // "I felt love" is only 11 characters, below 20 minimum
      expect(result.isValid).toBe(false)
      expect(result.suggestionMessage).toContain('more details')
    })
  })
})
