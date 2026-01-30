# Edge Functions Prompt Imports Review

**Date:** 2025-11-21  
**Project:** Dreamcatcher AI  
**Purpose:** Ensure consistent prompt imports across all edge functions

---

## 📋 Summary

### Prompt Sources
There are **TWO separate locations** where `AI_PROMPTS` is defined:

1. **`functions/aiPrompts.ts`** - Edge function version
2. **`src/config/aiPrompts.ts`** - Client app version

Both contain **identical prompt definitions** (verified), which is good for consistency.

---

## 🔍 Detailed Analysis

### Edge Functions Status

| Function | Location | Imports Prompts? | Import Source | Status |
|----------|----------|-----------------|----------------|---------| 
| create-admin | `/functions/create-admin/index.ts` | ❌ No | N/A | ⚠️ Doesn't need prompts |
| generate-og-tags | `/functions/generate-og-tags/index.ts` | ❌ No | N/A | ⚠️ Doesn't need prompts |
| **generate-video** | `/functions/generate-video/index.ts` | ✅ **Yes** | `../aiPrompts.ts` | ✅ **Correct** |
| generate-watermarked-image | `/functions/generate-watermarked-image/index.ts` | ❌ No | N/A | ⚠️ Doesn't need prompts |

### Detailed Breakdown

#### 1. **create-admin** (No prompts needed)
```typescript
// ❌ No prompt imports
// This function handles admin user creation only
// Does not perform AI operations
```
**Status:** ✅ Correct (doesn't need prompts)

---

#### 2. **generate-og-tags** (No prompts needed)
```typescript
// ❌ No prompt imports
// This function generates Open Graph metadata from existing dream data
// Does not perform AI operations or generation
```
**Status:** ✅ Correct (doesn't need prompts)

---

#### 3. **generate-video** ⭐ (Uses prompts)
```typescript
// ✅ IMPORTS PROMPTS
import { AI_PROMPTS } from "../aiPrompts.ts";

// Uses:
const framePrompts = AI_PROMPTS.generateVideoFrames(prompt);
```

**Status:** ✅ **Correct** - Imports from local `functions/aiPrompts.ts`

**Prompts Used:**
- `AI_PROMPTS.generateVideoFrames()` - Generates 3 cinematic frame descriptions

---

#### 4. **generate-watermarked-image** (No prompts needed)
```typescript
// ❌ No prompt imports
// This function generates images using Blink AI directly
// Does not use custom prompts from AI_PROMPTS config
// Just passes raw prompt string to blink.ai.generateImage()
```

**Status:** ⚠️ **Could be improved** (currently doesn't use AI_PROMPTS)

---

## 🎯 Key Findings

### ✅ Working Well
1. **generate-video** correctly imports `AI_PROMPTS` from `../aiPrompts.ts`
2. Both source files (`functions/aiPrompts.ts` and `src/config/aiPrompts.ts`) are synchronized
3. Prompt definitions are centralized and reusable

### ⚠️ Potential Issues

#### Issue 1: generate-watermarked-image Could Use Prompts
Currently, the function passes a raw `prompt` parameter directly:
```typescript
const { data: generatedImages } = await blink.ai.generateImage({
  prompt,  // Raw prompt from request
  n: 1,
});
```

**Better approach:** Could use `AI_PROMPTS.generateDreamImage()` if called from image generation workflow.

**Current Impact:** Low - This function works fine with direct prompts, but inconsistent with generate-video pattern.

---

#### Issue 2: Client App Uses Different Import
**`src/config/aiPrompts.ts`** is imported by client components but **NOT by edge functions** that could theoretically use it.

The edge functions have their own copy at `functions/aiPrompts.ts`, which is correct because:
- Edge functions run in Deno environment (can't import from `src/`)
- Each environment needs its own copy of shared code

---

## 📊 Prompts Coverage Matrix

### Which Functions Use Which Prompts?

```
AI_PROMPTS.generateDreamTitle           → Not used by any edge function
AI_PROMPTS.extractDreamTags             → Not used by any edge function
AI_PROMPTS.generateDreamInterpretation  → Not used by any edge function
AI_PROMPTS.generateDreamImage           → Not used by edge functions (only in client app)
AI_PROMPTS.detectEmotionalContent       → Not used by any edge function
AI_PROMPTS.generateVideoFrames          → ✅ Used by generate-video edge function

Helper Functions:
buildPersonalizedImagePromptSuffix      → Defined in both, used in client app
buildPersonalInterpretationContext      → Defined in both, used in client app
```

---

## 🔄 Content Comparison

### `functions/aiPrompts.ts` vs `src/config/aiPrompts.ts`

**Line-by-line comparison:**

| Prompt | functions/ | src/config/ | Match? |
|--------|------------|-------------|--------|
| generateDreamTitle | ✅ Present | ✅ Present | ✅ Identical |
| extractDreamTags | ✅ Present | ✅ Present | ✅ Identical |
| generateDreamInterpretation | ✅ Present | ✅ Present | ✅ Identical |
| generateDreamImage | ✅ Present | ✅ Present | ✅ Identical |
| detectEmotionalContent | ✅ Present | ✅ Present | ✅ Identical |
| generateVideoFrames | ✅ Present | ✅ Present | ✅ Identical |
| buildPersonalizedImagePromptSuffix | ✅ Present | ✅ Present | ✅ Identical |
| buildPersonalInterpretationContext | ✅ Present | ✅ Present | ✅ Identical |

**Result:** ✅ **100% Synchronized**

---

## 🚀 Recommendations

### Priority 1: No Action Needed ✅
- `generate-video` correctly uses `AI_PROMPTS.generateVideoFrames()`
- Both prompt files are synchronized
- Import paths are correct for each environment

### Priority 2: Consider Enhancement (Optional)
Optionally enhance `generate-watermarked-image` to use `AI_PROMPTS.generateDreamImage()`:

**Current:**
```typescript
const { data: generatedImages } = await blink.ai.generateImage({
  prompt,
  n: 1,
});
```

**Enhanced:**
```typescript
// Could import AI_PROMPTS and use:
const dreamTitle = "Dream"; // Would need to pass from client
const dreamDescription = prompt;
const enhancedPrompt = AI_PROMPTS.generateDreamImage(dreamTitle, dreamDescription);
const { data: generatedImages } = await blink.ai.generateImage({
  prompt: enhancedPrompt,
  n: 1,
});
```

**Decision:** Not critical since function works fine - only implement if you want consistent prompt formatting across all image generation.

---

## 📝 File Structure Summary

```
functions/
├── aiPrompts.ts                    ← Edge function prompts (GOOD)
├── create-admin/index.ts           ← No prompts (correct)
├── generate-og-tags/index.ts       ← No prompts (correct)
├── generate-video/index.ts         ← ✅ Uses aiPrompts.ts
└── generate-watermarked-image/index.ts ← Direct prompts (optional improvement)

src/
└── config/
    └── aiPrompts.ts               ← Client app prompts (GOOD)
```

---

## ✅ Conclusion

### Current State: **HEALTHY** ✅

1. **All edge functions that need prompts are importing them correctly**
2. **Both prompt files are synchronized**
3. **Import paths are correct for each environment**
4. **No breaking inconsistencies detected**

### Action Items:
- **Required:** None ✅
- **Optional:** Enhance `generate-watermarked-image` to use `AI_PROMPTS.generateDreamImage()` for consistency
- **Maintenance:** Keep both prompt files synchronized when updates needed

---

## 🔧 How to Keep Synchronized Going Forward

When updating prompts:

1. **Update BOTH files:**
   - `functions/aiPrompts.ts`
   - `src/config/aiPrompts.ts`

2. **Use consistent formatting** (both files already follow this)

3. **Test imports:**
   - Edge functions: `import { AI_PROMPTS } from "../aiPrompts.ts"`
   - Client app: `import { AI_PROMPTS } from "@/config/aiPrompts"`

4. **Redeploy edge functions** if any prompt changes

---

**Review Complete** ✅
