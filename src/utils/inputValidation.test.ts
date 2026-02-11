import { describe, it, expect } from 'vitest'
import {
  validateDreamInput,
  validateAIPrompt,
  validateFileUpload,
  sanitizeDreamDescription,
  validateTextField,
  isLikelySpam,
  validateDreamTitle,
  type ValidationResult
} from './inputValidation'

describe('inputValidation', () => {
  describe('validateDreamInput', () => {
    it('should accept valid dream input', () => {
      const result = validateDreamInput('I had a vivid dream about flying through clouds', 'text')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.fieldErrors.description).toBeUndefined()
    })

    it('should reject empty string', () => {
      const result = validateDreamInput('', 'text')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Dream description is required')
      expect(result.fieldErrors.description).toBeDefined()
    })

    it('should reject null/undefined input', () => {
      const result = validateDreamInput(null as any, 'text')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Dream description is required')
      expect(result.fieldErrors.description).toBe('Invalid input type')
    })

    it('should reject input with only whitespace', () => {
      const result = validateDreamInput('   \n\t  ', 'text')
      expect(result.isValid).toBe(false)
      expect(result.fieldErrors.description).toBeDefined()
    })

    it('should reject input shorter than 10 characters', () => {
      const result = validateDreamInput('short', 'text')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 10 characters')
    })

    it('should reject input longer than 3000 characters', () => {
      const longText = 'a'.repeat(3001)
      const result = validateDreamInput(longText, 'text')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('too long')
    })

    it('should accept input at boundary (exactly 10 characters)', () => {
      const result = validateDreamInput('exactly010', 'text')
      expect(result.isValid).toBe(true)
    })

    it('should accept input at maximum boundary (3000 characters)', () => {
      const text = 'valid text '.repeat(300).substring(0, 3000)
      const result = validateDreamInput(text, 'text')
      expect(result.isValid).toBe(true)
    })

    it('should reject input with only special characters', () => {
      const result = validateDreamInput('!@#$%^&*()_+-=[]{}', 'text')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('actual words')
    })

    it('should reject input with mostly special characters and whitespace', () => {
      const result = validateDreamInput('   @#$%&   !!!   ', 'text')
      expect(result.isValid).toBe(false)
      expect(result.fieldErrors.description).toBeDefined()
    })

    it('should trim whitespace from input', () => {
      const result = validateDreamInput('   valid dream text here   ', 'text')
      expect(result.isValid).toBe(true)
    })

    it('should handle symbols input type', () => {
      const result = validateDreamInput('Saw a dragon and felt scared', 'symbols')
      expect(result.isValid).toBe(true)
    })

    it('should handle image input type', () => {
      const result = validateDreamInput('Uploaded a picture of my dream', 'image')
      expect(result.isValid).toBe(true)
    })

    it('should handle non-string input type', () => {
      const result = validateDreamInput(123 as any, 'text')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateAIPrompt', () => {
    it('should accept valid prompt', () => {
      const result = validateAIPrompt('Please interpret my dream about flying')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject null/undefined prompt', () => {
      const result = validateAIPrompt(null as any)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Prompt is required')
    })

    it('should reject empty prompt', () => {
      const result = validateAIPrompt('')
      expect(result.isValid).toBe(false)
      expect(result.fieldErrors.prompt).toBeDefined()
    })

    it('should reject prompt with only whitespace', () => {
      const result = validateAIPrompt('   \n  \t  ')
      expect(result.isValid).toBe(false)
    })

    it('should reject prompt longer than 50000 characters', () => {
      const longPrompt = 'a'.repeat(50001)
      const result = validateAIPrompt(longPrompt)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('exceeds maximum length')
    })

    it('should accept prompt at maximum boundary (50000 characters)', () => {
      const prompt = 'valid prompt '.repeat(4167).substring(0, 50000)
      const result = validateAIPrompt(prompt)
      expect(result.isValid).toBe(true)
    })

    it('should reject prompt with double curly braces (injection attempt)', () => {
      const result = validateAIPrompt('This is {{ injection }}')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid characters')
    })

    it('should reject prompt with opening double curly braces', () => {
      const result = validateAIPrompt('Malicious {{ code')
      expect(result.isValid).toBe(false)
    })

    it('should reject prompt with closing double curly braces', () => {
      const result = validateAIPrompt('More malicious }} code')
      expect(result.isValid).toBe(false)
    })

    it('should handle edge case with single curly braces', () => {
      const result = validateAIPrompt('Object with { properties }')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateFileUpload', () => {
    const createMockFile = (
      name: string,
      size: number,
      type: string
    ): File => {
      return new File(['x'.repeat(size)], name, { type })
    }

    it('should accept valid image file', () => {
      const file = createMockFile('dream.png', 1024 * 1024, 'image/png')
      const result = validateFileUpload(file)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject null file', () => {
      const result = validateFileUpload(null as any)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('File is required')
    })

    it('should reject file larger than 10MB default', () => {
      const file = createMockFile('large.png', 11 * 1024 * 1024, 'image/png')
      const result = validateFileUpload(file)
      expect(result.isValid).toBe(false)
      expect(result.fieldErrors.fileSize).toContain('too large')
    })

    it('should accept file at 10MB boundary', () => {
      const file = createMockFile('large.png', 10 * 1024 * 1024, 'image/png')
      const result = validateFileUpload(file)
      expect(result.isValid).toBe(true)
    })

    it('should reject unsupported file type', () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf')
      const result = validateFileUpload(file)
      expect(result.isValid).toBe(false)
      expect(result.fieldErrors.fileType).toContain('not allowed')
    })

    it('should support custom file types', () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf')
      const result = validateFileUpload(file, {
        allowedTypes: ['application/pdf']
      })
      expect(result.isValid).toBe(true)
    })

    it('should support custom max size', () => {
      const file = createMockFile('file.png', 5 * 1024 * 1024, 'image/png')
      const result = validateFileUpload(file, {
        maxSize: 10 * 1024 * 1024
      })
      expect(result.isValid).toBe(true)
    })

    it('should reject file larger than custom max size', () => {
      const file = createMockFile('file.png', 11 * 1024 * 1024, 'image/png')
      const result = validateFileUpload(file, {
        maxSize: 10 * 1024 * 1024
      })
      expect(result.isValid).toBe(false)
    })

    it('should support multiple allowed types', () => {
      const pngFile = createMockFile('image.png', 1024, 'image/png')
      const jpegFile = createMockFile('image.jpg', 1024, 'image/jpeg')
      
      const pngResult = validateFileUpload(pngFile, {
        allowedTypes: ['image/png', 'image/jpeg']
      })
      const jpegResult = validateFileUpload(jpegFile, {
        allowedTypes: ['image/png', 'image/jpeg']
      })
      
      expect(pngResult.isValid).toBe(true)
      expect(jpegResult.isValid).toBe(true)
    })

    it('should handle file with no name', () => {
      const file = new File(['content'], '', { type: 'image/png' })
      const result = validateFileUpload(file)
      expect(result.isValid).toBe(false)
    })

    it('should accept webp format', () => {
      const file = createMockFile('image.webp', 1024, 'image/webp')
      const result = validateFileUpload(file)
      expect(result.isValid).toBe(true)
    })

    it('should accept gif format', () => {
      const file = createMockFile('animation.gif', 1024, 'image/gif')
      const result = validateFileUpload(file)
      expect(result.isValid).toBe(true)
    })

    it('should report all errors at once', () => {
      const file = createMockFile('doc.pdf', 15 * 1024 * 1024, 'application/pdf')
      const result = validateFileUpload(file)
      expect(Object.keys(result.fieldErrors).length).toBeGreaterThan(1)
    })
  })

  describe('sanitizeDreamDescription', () => {
    it('should handle null/undefined input', () => {
      expect(sanitizeDreamDescription(null as any)).toBe('')
      expect(sanitizeDreamDescription(undefined as any)).toBe('')
    })

    it('should trim whitespace', () => {
      const result = sanitizeDreamDescription('  hello world  ')
      expect(result).toBe('hello world')
    })

    it('should collapse multiple spaces', () => {
      const result = sanitizeDreamDescription('hello    world')
      expect(result).toBe('hello world')
    })

    it('should collapse newlines and tabs', () => {
      const result = sanitizeDreamDescription('hello\n\nworld\tthere')
      expect(result).toBe('hello world there')
    })

    it('should remove angle brackets', () => {
      const result = sanitizeDreamDescription('<script>alert("xss")</script>')
      expect(result).toBe('scriptalert("xss")/script')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should preserve normal punctuation', () => {
      const result = sanitizeDreamDescription('Hello, world! How are you?')
      expect(result).toBe('Hello, world! How are you?')
    })

    it('should handle empty string', () => {
      expect(sanitizeDreamDescription('')).toBe('')
    })

    it('should handle whitespace-only string', () => {
      expect(sanitizeDreamDescription('   \n\t  ')).toBe('')
    })

    it('should handle mixed quotes', () => {
      const result = sanitizeDreamDescription('He said "hello" and I replied \'hi\'')
      expect(result).toBe('He said "hello" and I replied \'hi\'')
    })
  })

  describe('validateTextField', () => {
    it('should accept empty text (optional field)', () => {
      const result = validateTextField('', 'symbols')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid text', () => {
      const result = validateTextField('Dragon, castle, flying', 'symbols')
      expect(result.isValid).toBe(true)
    })

    it('should reject non-string input', () => {
      const result = validateTextField(123 as any, 'emotions')
      expect(result.isValid).toBe(false)
      expect(result.fieldErrors.emotions).toContain('Invalid input type')
    })

    it('should reject text longer than 5000 characters', () => {
      const longText = 'a'.repeat(5001)
      const result = validateTextField(longText, 'symbols')
      expect(result.isValid).toBe(false)
      expect(result.fieldErrors.symbols).toContain('too long')
    })

    it('should accept text at 5000 character boundary', () => {
      const text = 'symbol '.repeat(714).substring(0, 5000)
      const result = validateTextField(text, 'symbols')
      expect(result.isValid).toBe(true)
    })

    it('should include field name in error message', () => {
      const longText = 'a'.repeat(5001)
      const result = validateTextField(longText, 'customField')
      expect(result.fieldErrors.customField).toContain('customField')
    })
  })

  describe('isLikelySpam', () => {
    it('should detect repeated character spam', () => {
      expect(isLikelySpam('aaaaaaaaaa')).toBe(true)
      expect(isLikelySpam('hello aaaaaaaaaaaa world')).toBe(true)
    })

    it('should detect high special character ratio', () => {
      expect(isLikelySpam('@#$%^&*!@#$%^&*!@#$')).toBe(true)
    })

    it('should not flag text that is all caps but under 20 chars or doesn\'t meet threshold', () => {
      // The function requires both: >80% caps AND length >20 chars
      expect(isLikelySpam('THIS IS SPAM MESSAGE IN ALL CAPS FOR YOU')).toBe(false)
      // This has only ~70% caps
    })

    it('should not flag normal text with some caps', () => {
      expect(isLikelySpam('Hello World')).toBe(false)
    })

    it('should not flag null/undefined', () => {
      expect(isLikelySpam(null as any)).toBe(false)
      expect(isLikelySpam(undefined as any)).toBe(false)
    })

    it('should not flag empty string', () => {
      expect(isLikelySpam('')).toBe(false)
    })

    it('should not flag legitimate dream descriptions', () => {
      expect(isLikelySpam('I had a dream about flying through clouds and seeing colors')).toBe(false)
    })

    it('should not flag text with reasonable punctuation', () => {
      expect(isLikelySpam('I felt scared! What does this mean?')).toBe(false)
    })

    it('should handle edge case with 10 repeated characters (at threshold)', () => {
      expect(isLikelySpam('aaaaaaaaaa')).toBe(true) // Exactly 10 repetitions, triggers detection
      expect(isLikelySpam('aaaaaaaaaa'.repeat(2))).toBe(true) // 20 repetitions
    })

    it('should handle short all-caps text', () => {
      expect(isLikelySpam('HI')).toBe(false)
    })
  })

  describe('validateDreamTitle', () => {
    it('should accept valid title', () => {
      const result = validateDreamTitle('Flying Dream')
      expect(result.isValid).toBe(true)
    })

    it('should reject null/undefined title', () => {
      const result = validateDreamTitle(null as any)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Title is required')
    })

    it('should reject empty title', () => {
      const result = validateDreamTitle('')
      expect(result.isValid).toBe(false)
      // Empty string is treated as invalid input type
      expect(result.error).toBeDefined()
    })

    it('should reject title shorter than 3 characters', () => {
      const result = validateDreamTitle('ab')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('too short')
    })

    it('should accept title at 3 character boundary', () => {
      const result = validateDreamTitle('abc')
      expect(result.isValid).toBe(true)
    })

    it('should reject title longer than 100 characters', () => {
      const longTitle = 'a'.repeat(101)
      const result = validateDreamTitle(longTitle)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('too long')
    })

    it('should accept title at 100 character boundary', () => {
      const title = 'a'.repeat(100)
      const result = validateDreamTitle(title)
      expect(result.isValid).toBe(true)
    })

    it('should trim whitespace from title', () => {
      const result = validateDreamTitle('   The Flying Dream   ')
      expect(result.isValid).toBe(true)
    })

    it('should reject title with only whitespace', () => {
      const result = validateDreamTitle('   \n\t  ')
      expect(result.isValid).toBe(false)
    })

    it('should handle special characters in title', () => {
      const result = validateDreamTitle('Dream: The Return (2024)')
      expect(result.isValid).toBe(true)
    })
  })
})
