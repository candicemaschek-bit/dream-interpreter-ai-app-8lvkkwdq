# Auto-Moderation System

## Overview

Dreamcatcher AI implements a **hybrid auto-moderation system** that combines rule-based automation with AI-assisted analysis to automatically detect and handle inappropriate content in the community dream feed.

**Strategy**: Conservative, privacy-first approach with multiple layers of protection.

---

## System Architecture

### Multi-Stage Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGE 1: CLIENT-SIDE                     │
│              On-Device Content Classification               │
│             (No cloud upload until consent)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─ Severity ≥ 0.9 → BLOCK UPLOAD
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    STAGE 2: PRE-UPLOAD CHECK                │
│              Verify against repeat offenders                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   STAGE 3: RULE-BASED AUTO-HIDE             │
│          Triggered when reports reach threshold             │
│       High confidence rules (≥5 reports + severity ≥0.7)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─ No rules match but ≥3 reports
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    STAGE 4: AI ANALYSIS                     │
│           AI evaluates edge cases (cost-optimized)          │
│         Confidence ≥ 85% → Apply recommendation             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
                  AUDIT TRAIL + APPEAL PROCESS
```

---

## Auto-Moderation Rules

### Rule 1: Extreme Content (Immediate Hide)
**Trigger**: Severity score ≥ 0.9  
**Action**: Hide  
**Confidence**: 95%  
**Reason**: "Extreme sensitive content detected"

### Rule 2: High Severity + Multiple Reports
**Trigger**: ≥5 reports AND severity ≥ 0.7  
**Action**: Hide  
**Confidence**: 90%  
**Reason**: "5+ reports with high severity score"

### Rule 3: Very High Severity + Some Reports
**Trigger**: ≥3 reports AND severity ≥ 0.8  
**Action**: Hide  
**Confidence**: 85%  
**Reason**: "3+ reports with very high severity"

### Rule 4: Multiple Sensitive Categories
**Trigger**: ≥4 reports AND 2+ categories (trauma/violence)  
**Action**: Hide  
**Confidence**: 80%  
**Reason**: "Multiple sensitive categories detected"

### Rule 5: Repeat Offender
**Trigger**: ≥3 previous violations AND ≥2 reports  
**Action**: Hide  
**Confidence**: 85%  
**Reason**: "Repeat offender pattern"

### Rule 6: New Account with Extreme Content
**Trigger**: Account <7 days old AND severity ≥ 0.8 AND ≥2 reports  
**Action**: Hide  
**Confidence**: 75%  
**Reason**: "New account with extreme content"

---

## AI-Assisted Analysis

### When AI is Triggered
- **Condition**: ≥3 reports BUT no rule match
- **Purpose**: Handle edge cases that rules miss
- **Cost Optimization**: Only called when needed (not on every report)

### AI Analysis Schema
```typescript
{
  violatesGuidelines: boolean
  confidence: number (0-1)
  category: 'spam' | 'hate_speech' | 'explicit_sexual' | 'graphic_violence' | 'harassment' | 'none'
  reasoning: string
  recommendedAction: 'none' | 'hide' | 'remove'
}
```

### AI Decision Threshold
- **Confidence**: ≥ 85% required for auto-action
- **Action**: AI's recommended action is applied if confidence met

---

## Integration Points

### 1. Pre-Upload Content Check
**File**: `src/utils/communityService.ts`  
**Function**: `shareToCommunity()`

```typescript
const preCheck = await preUploadContentCheck(content, userId)

if (!preCheck.allowed) {
  return { success: false, error: preCheck.reason }
}
```

**Blocks**:
- Extreme content (severity ≥ 0.9)
- Repeat offenders with high severity (3+ violations + severity ≥ 0.7)

**Warns**:
- Moderate content (severity ≥ 0.6)

---

### 2. Post-Report Auto-Moderation
**File**: `src/utils/reportingService.ts`  
**Function**: `reportDream()`

```typescript
const autoModResult = await checkAutoModerationOnReport(
  dreamId,
  dream.userId,
  dreamContent
)

if (autoModResult.autoModerated) {
  // Dream was automatically hidden/removed
  console.log('Auto-moderation action taken')
}
```

**Triggers after each new report** to evaluate if thresholds are met.

---

### 3. Admin UI Indicators
**File**: `src/components/AdminModerationQueue.tsx`

**Shows**:
- Auto-moderation notice explaining active rules
- Purple badge on dreams that may have been auto-moderated
- Audit trail with system actions

---

## Audit Trail

All auto-moderation actions are logged with:
- **Moderator ID**: `system` (distinguishes automated from manual actions)
- **Action Reason**: Includes rule name, confidence score, AI analysis
- **Timestamp**: When action was taken
- **Report IDs**: Which reports triggered the action

### Example Audit Entry
```
AUTO-MODERATION ACTION
Reason: 5+ reports with high severity score (≥ 0.7)
Confidence: 90.0%
Rules Matched: high_severity_multiple_reports
```

---

## Appeal Process

Users can appeal auto-moderation decisions:

```typescript
await appealAutoModeration(dreamId, appealReason)
```

**What happens**:
1. Dream status changed to `under_review`
2. Appeal logged in audit trail
3. Escalated to human moderators
4. Admin can reverse decision if appropriate

---

## Sensitive Content Classification

### Categories Detected
- **Trauma**: Abuse, death, loss, PTSD triggers
- **Sexuality**: Sexual content, intimacy
- **Violence**: Aggression, harm, blood
- **Fears**: Phobias, anxiety triggers

### Severity Score (0-1)
- **0.0-0.2**: Low (standard content)
- **0.2-0.4**: Mild (some emotional themes)
- **0.4-0.6**: Moderate (sensitive themes)
- **0.6-0.8**: High (multiple sensitive themes)
- **0.8-1.0**: Very High (extreme content)

---

## Privacy & Transparency

### User Privacy
- Content classification runs **on-device** before cloud upload
- Reporter identity **anonymized** via SHA-256 hashing
- No personal data exposed in moderation logs

### Transparency
- Auto-moderation rules are clearly documented
- Confidence scores shown in audit trail
- Users warned if content may be flagged
- Appeal process available for all automated actions

---

## Admin Tools

### View Auto-Moderation Stats
```typescript
const stats = await getAutoModerationStats()

// Returns:
{
  totalAutoModerated: number
  autoHidden: number
  autoRemoved: number
  averageConfidence: number
  topRules: Array<{ rule: string; count: number }>
}
```

### Review Auto-Moderated Content
1. Go to **Admin Dashboard** → **Moderation Queue**
2. Look for purple "Auto-Moderation May Be Active" badge
3. Check **Audit Trail** for system actions
4. Can reverse decision if incorrect

---

## Testing the System

### Test Scenario 1: High Severity Content
1. Create dream with extreme sensitive keywords
2. Share to community
3. **Expected**: Blocked at pre-upload check

### Test Scenario 2: Multiple Reports
1. Create normal dream and share
2. Have 5 users report it
3. Add high severity keywords in description
4. **Expected**: Auto-hidden after 5th report

### Test Scenario 3: AI Analysis
1. Create dream with 3 reports but no clear rule violation
2. **Expected**: AI analyzes content and recommends action

### Test Scenario 4: Repeat Offender
1. User has 3+ previous violations
2. Shares dream that gets 2+ reports
3. **Expected**: Auto-hidden due to repeat offender rule

---

## Configuration & Tuning

### Adjusting Thresholds
Edit `src/utils/autoModerationService.ts`:

```typescript
const AUTO_MODERATION_RULES: AutoModerationRule[] = [
  {
    name: 'extreme_content',
    condition: (ctx) => ctx.contentFlags.severityScore >= 0.9, // ADJUST HERE
    action: 'hide',
    confidence: 0.95,
    reason: 'Extreme sensitive content detected'
  },
  // ... more rules
]
```

### Monitoring Performance
- Track false positive rate from appeals
- Review audit trail for pattern recognition
- Adjust confidence thresholds based on data

---

## Future Enhancements

### Potential Improvements
1. **Pattern Detection**: Identify spam campaigns, mass reporting abuse
2. **User Reputation**: Trust score based on history
3. **Context Awareness**: Understand cultural differences
4. **Image Analysis**: Computer vision for uploaded images
5. **Multilingual**: Support non-English content classification

---

## Technical Details

### Key Files
- `src/utils/autoModerationService.ts` - Main auto-moderation logic
- `src/utils/sensitiveContentClassifier.ts` - Client-side content analysis
- `src/utils/reportingService.ts` - Report handling + auto-mod trigger
- `src/utils/communityService.ts` - Pre-upload checks
- `src/components/AdminModerationQueue.tsx` - Admin UI

### Dependencies
- **Blink SDK AI**: For AI content analysis
- **Web Crypto API**: For SHA-256 hashing (reporter anonymity)
- **Database**: SQLite for audit trail and moderation logs

---

## Best Practices

### For Admins
✅ **DO**:
- Review auto-moderated content regularly
- Check audit trail for system actions
- Be responsive to appeals
- Tune thresholds based on community needs

❌ **DON'T**:
- Blindly trust auto-moderation
- Ignore appeals
- Make rules too aggressive (high false positives)
- Remove transparency

### For Users
✅ **DO**:
- Report genuine violations
- Appeal if you believe decision is incorrect
- Understand community guidelines
- Use sensitivity filters appropriately

❌ **DON'T**:
- Abuse reporting system
- Share extreme content intentionally
- Mass-report competitors
- Circumvent filters

---

## Summary

The auto-moderation system provides **fast, accurate, and privacy-first** content moderation for Dreamcatcher AI's community features. It combines rule-based automation for clear violations with AI-assisted analysis for edge cases, all while maintaining transparency and allowing appeals.

**Key Benefits**:
- ⚡ Instant action on clear violations
- 🤖 AI handles edge cases intelligently
- 🔒 Privacy-first (on-device classification)
- 📊 Full audit trail for accountability
- 🔄 Appeal process for fairness
- 💰 Cost-optimized (AI only when needed)

For questions or issues, contact: support@dreamcatcher.ai
