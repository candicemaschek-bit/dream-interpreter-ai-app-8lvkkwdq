# AI Prompts List - Quick Reference

## 📋 All Prompts Defined

### 1. **generateDreamTitle**
**Purpose:** Creates a compelling, poetic title from dream description  
**Used By:** Client app (DreamInput component)  
**Status:** Defined in both locations ✅

```typescript
generateDreamTitle: (dreamDescription: string): string =>
  `Generate a compelling dream title (max 5 words). Be poetic yet clear.\n\nDream: ${dreamDescription}\n\nReturn ONLY the title, no quotes or extra formatting.`
```

---

### 2. **extractDreamTags**
**Purpose:** Identifies symbolic elements and tags from dream  
**Used By:** Client app (dream interpretation flow)  
**Status:** Defined in both locations ✅

```typescript
extractDreamTags: (title: string, dreamDescription: string): string =>
  `Extract 3-8 symbolic tags from this dream as a JSON array (lowercase, single words).\n\nDream: ${title}\n${dreamDescription}\n\nExamples: [\"water\", \"flight\", \"falling\", \"transformation\", \"lost\", \"fire\"]\n\nReturn ONLY the JSON array.`
```

---

### 3. **generateDreamInterpretation**
**Purpose:** Provides detailed psychological and symbolic interpretation  
**Used By:** Client app (interpretation results)  
**Status:** Defined in both locations ✅

```typescript
generateDreamInterpretation: (
  title: string,
  dreamDescription: string,
  tags: string[],
  personalContext?: string
): string =>
  `You are a compassionate dream interpreter. Analyze this dream and provide meaningful insights.\n\nDream: ${title}\nDescription: ${dreamDescription}\nSymbols: ${tags.join(', ')}${personalContext || ''}\n\nStructure your interpretation:\n1. Core Meaning\n2. Symbol Interpretations\n3. Emotional Insights\n4. Life Connections\n5. Reflection Prompts\n\nBe empathetic and considerate of the dreamer's context.`
```

---

### 4. **generateDreamImage**
**Purpose:** Creates visual representation of dream  
**Used By:** Client app (image generation)  
**Status:** Defined in both locations ✅

```typescript
generateDreamImage: (title: string, dreamDescription: string, imagePromptSuffix: string = ''): string =>
  `Create a vivid, dreamlike visualization of this dream.\n\nTitle: ${title}\nDescription: ${dreamDescription}\n\nStyle: Surreal, ethereal, mystical. Soft lighting, ethereal atmosphere. Capture the dream's essence with cinematic quality.${imagePromptSuffix}`
```

---

### 5. **detectEmotionalContent**
**Purpose:** Analyzes emotional content in dream description  
**Used By:** Client app (emotion validation)  
**Status:** Defined in both locations ✅

```typescript
detectEmotionalContent: (dreamDescription: string): string =>
  `Analyze the emotional content in this dream.\n\nDream: ${dreamDescription}\n\nRespond with ONLY this JSON format:\n{\n  "hasEmotionalContent": true/false,\n  "detectedEmotions": ["emotion1", "emotion2"],\n  "confidence": 0.0-1.0,\n  "suggestion": "Brief note if no emotions"\n}\n\nEmotion examples: fear, joy, anxiety, sadness, excitement, confusion, anger, peace.`
```

---

### 6. **generateVideoFrames** ⭐ (USED IN EDGE FUNCTION)
**Purpose:** Creates cinematic frames for dream video  
**Used By:** 
- Client app (video generation)
- **✅ Edge function: `generate-video/index.ts`**

**Status:** Defined in both locations ✅ | **Imported by edge function** ✅

```typescript
generateVideoFrames: (prompt: string): string[] => [
  `Frame 1: ${prompt}. Ethereal opening with soft focus and misty lighting.`,
  `Frame 2: ${prompt}. Intensify the narrative with mystical elements and flowing energy.`,
  `Frame 3: ${prompt}. Transcendent conclusion with ethereal light and peace.`
]
```

---

## 🛠️ Helper Functions

### buildPersonalizedImagePromptSuffix
**Purpose:** Generates gender & age-based personalization suffix for image prompts  
**Used By:** Client app  
**Status:** Defined in both locations ✅

**Logic:**
- Adds gender-specific phrasing (male, female, both)
- Adds age-appropriate perspective (youth, young adult, mature, wise)
- Returns combined suffix string

---

### buildPersonalInterpretationContext
**Purpose:** Builds personalized context for dream interpretation based on user profile  
**Used By:** Client app  
**Status:** Defined in both locations ✅

**Logic:**
- Includes user name, age, gender
- Notes if nightmare-prone (adds supportive guidance)
- Notes if recurring dreams (highlights patterns)
- Considers life stage in interpretation

---

## 📊 Summary Table

| Prompt Name | Type | Used by Edge Funcs | Used by Client | Synced | Status |
|-------------|------|-------------------|-----------------|--------|--------|
| generateDreamTitle | Function | ❌ | ✅ | ✅ | ✅ Good |
| extractDreamTags | Function | ❌ | ✅ | ✅ | ✅ Good |
| generateDreamInterpretation | Function | ❌ | ✅ | ✅ | ✅ Good |
| generateDreamImage | Function | ❌ | ✅ | ✅ | ✅ Good |
| detectEmotionalContent | Function | ❌ | ✅ | ✅ | ✅ Good |
| **generateVideoFrames** | **Function** | **✅** | **✅** | **✅** | **✅ Perfect** |
| buildPersonalizedImagePromptSuffix | Helper | ❌ | ✅ | ✅ | ✅ Good |
| buildPersonalInterpretationContext | Helper | ❌ | ✅ | ✅ | ✅ Good |

---

## 🎯 Edge Function Import Status

### ✅ generate-video
**File:** `functions/generate-video/index.ts`  
**Import Line:**
```typescript
import { AI_PROMPTS } from "../aiPrompts.ts";
```

**Prompts Used:**
```typescript
const framePrompts = AI_PROMPTS.generateVideoFrames(prompt);
```

**Status:** ✅ **Correctly imported and used**

---

### ❌ create-admin
**File:** `functions/create-admin/index.ts`  
**Prompts Used:** None (creates admin users only)  
**Status:** ✅ Correct (no prompts needed)

---

### ❌ generate-og-tags
**File:** `functions/generate-og-tags/index.ts`  
**Prompts Used:** None (generates metadata from existing data)  
**Status:** ✅ Correct (no prompts needed)

---

### ❌ generate-watermarked-image
**File:** `functions/generate-watermarked-image/index.ts`  
**Prompts Used:** Receives raw `prompt` parameter, doesn't use `AI_PROMPTS`  
**Status:** ⚠️ Works fine but doesn't use centralized prompts (optional improvement)

---

## 🔐 File Locations

```
📁 functions/
  └── aiPrompts.ts ← Edge function prompts (source of truth for edge functions)
      ├── AI_PROMPTS (8 items) ✅
      ├── buildPersonalizedImagePromptSuffix ✅
      └── buildPersonalInterpretationContext ✅

📁 src/
  └── 📁 config/
      └── aiPrompts.ts ← Client app prompts (source of truth for client)
          ├── AI_PROMPTS (8 items) ✅
          ├── buildPersonalizedImagePromptSuffix ✅
          └── buildPersonalInterpretationContext ✅
```

---

## ✅ Verification Results

| Check | Result | Notes |
|-------|--------|-------|
| Both files exist | ✅ Yes | functions/aiPrompts.ts + src/config/aiPrompts.ts |
| Identical content | ✅ Yes | All 8 items match exactly |
| Correct imports | ✅ Yes | generate-video uses ../aiPrompts.ts |
| No missing imports | ✅ Yes | Only generate-video needs prompts, and it has them |
| No broken references | ✅ Yes | All imports resolve correctly |

---

## 🚀 Bottom Line

**Status: HEALTHY ✅**

- ✅ All prompts are defined in both locations
- ✅ Both files are perfectly synchronized
- ✅ The only edge function that uses prompts (generate-video) imports them correctly
- ✅ No inconsistencies or missing imports detected

**Maintenance Note:** When updating prompts in the future, update both files to keep them synchronized.

---

**Last Updated:** 2025-11-21  
**Review Status:** Complete ✅
