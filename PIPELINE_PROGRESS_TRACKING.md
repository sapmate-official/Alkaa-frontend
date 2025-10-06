# Pipeline Progress Tracking Implementation

## Overview

The Payroll Pipeline now includes **persistent progress tracking** that saves the workflow state to the database. This allows users to:
- Close their browser and resume exactly where they left off
- Switch between different devices/sessions
- Recover from browser crashes or network issues
- Track pipeline state per organization and month/year

## Architecture

### Data Separation

The system maintains two distinct types of data:

1. **Payroll Data** (Existing V3 APIs)
   - Payroll cycles, salary records, approvals
   - Managed by: `/api/v3/payroll/*` endpoints
   - Stored in: `PayrollCycle`, `SalaryRecord` tables

2. **UI State** (New Pipeline Progress API)
   - Current step position, completion flags
   - Managed by: `/api/v3/payroll/pipeline/progress` endpoints
   - Stored in: `PipelineProgress` table

### Database Schema

```prisma
model PipelineProgress {
  id             String   @id @default(cuid())
  organizationId String
  month          Int      // 1-12
  year           Int      // 2000-2100
  currentStep    Int      @default(0) // 0-5 (step index)
  stepData       Json     @default("{}") // Flexible JSON storage
  lastAccessedAt DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([organizationId, month, year])
  @@index([organizationId])
}
```

**Key Constraints:**
- One progress record per organization/month/year combination
- Automatically updates `lastAccessedAt` on retrieval
- JSON `stepData` stores flexible state information

## Backend Implementation

### Controller: `pipelineProgressController.js`

Located: `backend/src/controller/v3/Payroll/pipelineProgressController.js`

#### 1. Get Pipeline Progress
```javascript
// GET /api/v3/payroll/pipeline/progress/:month/:year
export const getPipelineProgress = async (req, res) => {
  // Validates: month (1-12), year (2000-2100)
  // Checks: canViewPayroll permission
  // Returns: { currentStep, stepData, lastAccessedAt, createdAt }
  // Updates: lastAccessedAt timestamp
}
```

#### 2. Save Pipeline Progress
```javascript
// POST /api/v3/payroll/pipeline/progress
// Body: { month, year, currentStep, stepData }
export const savePipelineProgress = async (req, res) => {
  // Validates: month (1-12), year (2000-2100), step (0-5)
  // Checks: canManagePayroll permission
  // Action: Upserts progress record (create or update)
  // Returns: saved progress data
}
```

#### 3. Clear Pipeline Progress
```javascript
// DELETE /api/v3/payroll/pipeline/progress/:month/:year
export const clearPipelineProgress = async (req, res) => {
  // Validates: month (1-12), year (2000-2100)
  // Checks: canManagePayroll permission
  // Action: Deletes progress record
  // Use: After final workflow completion
}
```

### Routes: `payroll.router.js`

```javascript
import {
  getPipelineProgress,
  savePipelineProgress,
  clearPipelineProgress,
} from '../controller/v3/Payroll/pipelineProgressController.js'

// Progress tracking routes (all require validateToken)
router.get('/pipeline/progress/:month/:year', validateToken, getPipelineProgress)
router.post('/pipeline/progress', validateToken, savePipelineProgress)
router.delete('/pipeline/progress/:month/:year', validateToken, clearPipelineProgress)
```

## Frontend Implementation

### API Service: `pipelineApi.ts`

Located: `frontend/src/.../services/pipelineApi.ts`

```typescript
export interface PipelineProgressData {
  currentStep: number
  stepData: {
    setupCompleted?: boolean
    employeesSelected?: boolean
    templateAssigned?: boolean
    salariesProcessed?: boolean
    reviewCompleted?: boolean
    finalApproved?: boolean
    cycleId?: string
    cycle?: any
    template?: any
    // ... additional state fields
  }
  lastAccessedAt?: string
  createdAt?: string
}

// Load saved progress
export const getPipelineProgress = async (month: number, year: number)

// Save current progress
export const savePipelineProgress = async (
  month: number,
  year: number,
  currentStep: number,
  stepData: PipelineProgressData['stepData']
)

// Clear progress after completion
export const clearPipelineProgress = async (month: number, year: number)
```

### Component Integration: `PayrollPipelinePage.tsx`

#### State Management

```typescript
const [currentStep, setCurrentStep] = useState(1)
const [cycleData, setCycleData] = useState<CycleData>(INITIAL_CYCLE_DATA)
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
const [isLoadingProgress, setIsLoadingProgress] = useState(false)
const [isSavingProgress, setIsSavingProgress] = useState(false)
const [hasSavedProgress, setHasSavedProgress] = useState(false)
```

#### Load Progress on Mount

```typescript
useEffect(() => {
  const loadProgress = async () => {
    const response = await getPipelineProgress(month, year)
    
    if (response.success && response.data) {
      const { currentStep: savedStep, stepData } = response.data
      
      // Restore cycle data from step data
      const restoredCycleData: CycleData = {
        ...INITIAL_CYCLE_DATA,
        cycleId: stepData.cycleId,
        cycle: stepData.cycle,
        setupComplete: stepData.setupCompleted || false,
        allProcessed: stepData.salariesProcessed || false,
        // ... restore all fields
      }

      setCurrentStep(savedStep)
      setCycleData(restoredCycleData)
      
      toast({
        title: 'Progress Restored',
        description: `Resumed from step ${savedStep}`,
      })
    }
  }

  loadProgress()
}, []) // Only run on mount
```

#### Auto-Save Progress

```typescript
// Debounced auto-save when data changes
useEffect(() => {
  if (hasUnsavedChanges && cycleData.month && cycleData.year) {
    const timer = setTimeout(() => {
      handleSaveProgress() // Saves after 2 seconds of inactivity
    }, 2000)
    
    return () => clearTimeout(timer)
  }
}, [hasUnsavedChanges, cycleData.month, cycleData.year])

// Save function
const handleSaveProgress = async () => {
  const stepData = {
    setupCompleted: cycleData.setupComplete,
    salariesProcessed: cycleData.allProcessed,
    reviewCompleted: cycleData.allReviewed,
    finalApproved: cycleData.approved,
    cycleId: cycleData.cycleId,
    cycle: cycleData.cycle,
    // ... include all relevant state
  }

  await savePipelineProgress(month, year, currentStep, stepData)
  setHasUnsavedChanges(false)
  
  toast({
    title: 'Progress Saved',
    description: 'Your pipeline progress has been saved.',
  })
}
```

#### Clear Progress After Completion

```typescript
useEffect(() => {
  const clearProgressAfterCompletion = async () => {
    if (cycleData.payoutComplete && hasSavedProgress) {
      await clearPipelineProgress(cycleData.month, cycleData.year)
      setHasSavedProgress(false)
      
      toast({
        title: 'Pipeline Complete',
        description: 'Progress has been cleared.',
      })
    }
  }

  clearProgressAfterCompletion()
}, [cycleData.payoutComplete, hasSavedProgress])
```

## User Experience

### Normal Workflow

1. **User starts pipeline for January 2025**
   - Selects month/year, creates cycle
   - Pipeline loads step 1 (Create Cycle)

2. **User progresses through steps**
   - Step 2: Setup & Configuration ✅
   - Step 3: Process Salaries ✅
   - Progress auto-saves every 2 seconds after changes

3. **User closes browser at Step 4 (Review)**
   - Last saved: Step 4, with all cycle data

4. **User returns next day**
   - Pipeline loads saved progress
   - Toast: "Progress Restored: Resumed from step 4: Review & Approval"
   - All data intact, continues from Step 4

5. **User completes pipeline**
   - Final step: Transactions & Payout ✅
   - Progress automatically cleared
   - Next time: Fresh start for new month

### Multi-User Collaboration

**Scenario:** Organization has multiple admins

- **Admin A** starts January pipeline, reaches Step 3
- **Admin B** logs in, sees saved progress
- **Admin B** continues from Step 3
- Both can work on same pipeline (last save wins)

### Error Recovery

**Browser crashes during processing:**
- Progress saved up to last successful step
- User refreshes → Pipeline resumes
- No data loss, no need to restart

## Testing Guide

### Test 1: Basic Save/Restore

```bash
# Steps:
1. Start pipeline for "March 2025"
2. Complete Step 1 (Create Cycle)
3. Complete Step 2 (Setup)
4. Reach Step 3 (Processing)
5. Refresh browser (Ctrl+R or F5)

# Expected Result:
- Pipeline resumes at Step 3
- Toast shows "Progress Restored"
- All cycle data intact
```

### Test 2: Multi-Device Resume

```bash
# Steps:
1. User starts pipeline on Desktop (reach Step 2)
2. Close browser
3. User opens pipeline on Laptop
4. Same organization, same month/year

# Expected Result:
- Pipeline loads at Step 2 on Laptop
- Same cycle data visible
- Can continue workflow seamlessly
```

### Test 3: Auto-Save Behavior

```bash
# Steps:
1. Start pipeline, reach Step 2
2. Make a change (toggle checkbox, select option)
3. Observe "Save Progress" button
4. Wait 2 seconds without changes

# Expected Result:
- Button shows "Saving..." briefly
- Then shows "Saved"
- Toast: "Progress Saved"
```

### Test 4: Completion Cleanup

```bash
# Steps:
1. Complete entire pipeline through Step 6
2. Mark payouts as complete
3. Refresh browser
4. Check pipeline for same month/year

# Expected Result:
- Pipeline starts fresh at Step 1
- No saved progress found
- Previous progress was cleared after completion
```

### Test 5: Permission Validation

```bash
# Steps:
1. User with only "view" permission logs in
2. Attempts to save progress

# Expected Result:
- GET (load progress) works ✅
- POST (save progress) fails ❌ (403 Forbidden)
- DELETE (clear progress) fails ❌ (403 Forbidden)
```

## API Response Examples

### Load Progress (Success)

```json
GET /api/v3/payroll/pipeline/progress/3/2025

Response (200):
{
  "success": true,
  "data": {
    "currentStep": 3,
    "stepData": {
      "setupCompleted": true,
      "employeesSelected": true,
      "salariesProcessed": false,
      "cycleId": "clx123abc",
      "cycle": { ... }
    },
    "lastAccessedAt": "2025-03-15T10:30:00Z",
    "createdAt": "2025-03-14T08:00:00Z"
  },
  "message": "Pipeline progress retrieved"
}
```

### Load Progress (No Saved Progress)

```json
GET /api/v3/payroll/pipeline/progress/3/2025

Response (200):
{
  "success": true,
  "data": null,
  "message": "No saved progress found"
}
```

### Save Progress (Success)

```json
POST /api/v3/payroll/pipeline/progress
Body: {
  "month": 3,
  "year": 2025,
  "currentStep": 3,
  "stepData": {
    "setupCompleted": true,
    "salariesProcessed": true,
    "cycleId": "clx123abc"
  }
}

Response (200):
{
  "success": true,
  "message": "Pipeline progress saved",
  "data": {
    "id": "clx789xyz",
    "organizationId": "org_123",
    "month": 3,
    "year": 2025,
    "currentStep": 3,
    "stepData": { ... },
    "updatedAt": "2025-03-15T10:35:00Z"
  }
}
```

### Clear Progress (Success)

```json
DELETE /api/v3/payroll/pipeline/progress/3/2025

Response (200):
{
  "success": true,
  "message": "Pipeline progress cleared"
}
```

### Error Responses

#### Invalid Month
```json
Response (400):
{
  "success": false,
  "message": "Invalid month. Must be between 1 and 12"
}
```

#### Permission Denied
```json
Response (403):
{
  "success": false,
  "message": "You don't have permission to manage payroll"
}
```

## Security Considerations

### Permission Checks

- **Load Progress**: Requires `canViewPayroll` permission
- **Save Progress**: Requires `canManagePayroll` permission
- **Clear Progress**: Requires `canManagePayroll` permission

### Organization Isolation

- Progress records are filtered by `organizationId`
- Users can only access their organization's progress
- Multi-tenant architecture enforced at database level

### Input Validation

```javascript
// Month validation
if (month < 1 || month > 12) {
  return res.status(400).json({
    success: false,
    message: 'Invalid month. Must be between 1 and 12'
  })
}

// Year validation
if (year < 2000 || year > 2100) {
  return res.status(400).json({
    success: false,
    message: 'Invalid year. Must be between 2000 and 2100'
  })
}

// Step validation
if (currentStep < 0 || currentStep > 5) {
  return res.status(400).json({
    success: false,
    message: 'Invalid step. Must be between 0 and 5'
  })
}
```

## Performance Optimization

### Debounced Auto-Save

- Saves only after 2 seconds of inactivity
- Prevents excessive API calls during rapid changes
- Reduces database write operations

### Unique Constraint

- `@@unique([organizationId, month, year])`
- Ensures only one progress record per pipeline
- Uses upsert for efficient create/update

### Indexed Queries

- Index on `organizationId` for fast lookups
- Composite unique index improves query performance

### Last Accessed Tracking

- `lastAccessedAt` field updated on retrieval
- Useful for cleanup of stale progress records
- Can implement auto-cleanup after X days of inactivity

## Troubleshooting

### Issue: Progress not loading

**Symptoms:**
- Pipeline always starts at Step 1
- No "Progress Restored" toast

**Possible Causes:**
1. No saved progress for month/year
2. API endpoint not responding
3. Permission issues

**Debug Steps:**
```bash
# Check browser console for errors
# Open DevTools → Console

# Check API response
GET /api/v3/payroll/pipeline/progress/3/2025

# Verify database record
SELECT * FROM "PipelineProgress" 
WHERE "organizationId" = 'org_123' 
AND month = 3 AND year = 2025;
```

### Issue: Progress not saving

**Symptoms:**
- "Save Progress" button never becomes "Saved"
- Toast shows "Save Failed"

**Possible Causes:**
1. User lacks `canManagePayroll` permission
2. Invalid month/year/step values
3. Network connectivity issues

**Debug Steps:**
```bash
# Check browser console for API errors

# Verify user permissions
# Check user's role and permissions in database

# Test save endpoint directly
POST /api/v3/payroll/pipeline/progress
Body: {
  "month": 3,
  "year": 2025,
  "currentStep": 1,
  "stepData": {}
}
```

### Issue: Progress persists after completion

**Symptoms:**
- Pipeline resumes even after full completion
- Should start fresh but loads old state

**Solution:**
```bash
# Manually clear progress
DELETE /api/v3/payroll/pipeline/progress/3/2025

# Or via database
DELETE FROM "PipelineProgress" 
WHERE month = 3 AND year = 2025;

# Check if payoutComplete is properly set
# Verify clearProgress is called in PayrollPipelinePage
```

## Future Enhancements

### 1. Progress History
```prisma
model PipelineProgressHistory {
  id             String   @id @default(cuid())
  organizationId String
  month          Int
  year           Int
  completedAt    DateTime
  totalSteps     Int
  duration       Int      // minutes
  completedBy    String
}
```

### 2. Auto-Cleanup Job
```javascript
// Clean up progress older than 30 days
const cleanupStaleProgress = async () => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  await prisma.pipelineProgress.deleteMany({
    where: {
      lastAccessedAt: { lt: thirtyDaysAgo }
    }
  })
}
```

### 3. Real-Time Collaboration Indicators
```typescript
// Show which user is currently working on pipeline
interface CollaborationState {
  currentUser: {
    id: string
    name: string
    currentStep: number
    lastActive: Date
  }
}
```

### 4. Version Control for Step Data
```json
{
  "stepData": {
    "version": 2,
    "data": { ... },
    "migrations": [
      { "from": 1, "to": 2, "appliedAt": "..." }
    ]
  }
}
```

## Summary

The Pipeline Progress Tracking feature provides:

✅ **Persistent State Management** - Resume pipelines across sessions
✅ **Database-Backed Storage** - Reliable, multi-device support
✅ **Auto-Save Functionality** - Seamless user experience
✅ **Permission-Based Security** - Proper access control
✅ **Automatic Cleanup** - Clears after completion
✅ **Separation of Concerns** - UI state vs. payroll data

This implementation ensures users never lose their progress and can confidently work through complex, multi-step payroll workflows.
