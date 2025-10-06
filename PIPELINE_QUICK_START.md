# Quick Start Guide - Payroll Pipeline

## How to Use the Pipeline

### Option 1: Add to Router

```typescript
// In your router configuration file
import PayrollPipelinePage from './path/to/PayrollPipelinePage'

{
  path: '/p/payroll/admin/pipeline',
  element: <PayrollPipelinePage />
}
```

### Option 2: Navigate Programmatically

```typescript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/p/payroll/admin/pipeline')
```

---

## Step-by-Step Usage

### 1. Create Cycle (Step 1)
- Select month and year
- Choose salary template from dropdown
- Click "Create Payroll Cycle"
- ✅ Auto-advances to Step 2

### 2. Setup & Configuration (Step 2)
- Review employee count
- Verify setup checklist
- Click "Complete Setup & Start Processing"
- ✅ Auto-advances to Step 3

### 3. Process Salaries (Step 3)
- Click "Start Salary Processing"
- Watch progress bar animate
- See real-time employee counters
- Click "Submit for Review & Approval"
- ✅ Auto-advances to Step 4

### 4. Review & Validation (Step 4)
- Click "Start Review Process"
- Review the checklist
- Click "Approve All Reviews"
- Click "Proceed to Final Approval"
- ✅ Auto-advances to Step 5

### 5. Final Approval (Step 5)
- Review approval summary
- Check total amount and employee count
- Click "Approve & Lock Payroll Cycle"
- Confirm in dialog ⚠️
- Click "Proceed to Payout & Transactions"
- ✅ Auto-advances to Step 6

### 6. Transactions & Payout (Step 6)
- Review payout summary
- Click "Initiate Bank Transfers"
- Watch payout progress
- See celebration message! 🎉
- Download reports
- ✅ Pipeline complete!

---

## Key Features

### Navigation
- **Forward:** Click "Next Step" (enabled when step validates)
- **Back:** Click "Previous" (go back to review)
- **Jump:** Click any completed step in visual pipeline

### State Management
- **Auto-save:** Every 2 seconds
- **Persistence:** Survives page refresh
- **Resume:** Pick up where you left off

### Validation
- Can't proceed until step requirements met
- Next button disabled until completion
- Clear status indicators

---

## Visual Status Indicators

| Icon | Meaning |
|------|---------|
| ✅ | Step completed |
| 🔵 | Step in progress (spinning) |
| ⏱️ | Step pending (number shown) |
| ❌ | Step failed |

---

## Color Meanings

| Color | Purpose |
|-------|---------|
| 🔵 Blue | Information, guidance, active state |
| 🟢 Green | Success, completion, ready |
| 🔴 Red | Warning, error, critical action |
| ⚪ Gray | Secondary, disabled, placeholder |

---

## Common Actions

### Restart Pipeline
```typescript
// Clear saved progress
localStorage.removeItem('payroll_pipeline_progress')
// Refresh page
```

### Check Current Progress
```typescript
// View in localStorage
const progress = localStorage.getItem('payroll_pipeline_progress')
console.log(JSON.parse(progress))
```

### Skip to Specific Step
```typescript
// Only works for completed steps
// Click the step number in visual pipeline
```

---

## Keyboard Shortcuts (Future)

| Key | Action |
|-----|--------|
| Enter | Proceed to next step (when enabled) |
| Esc | Cancel action/dialog |
| ← | Go to previous step |
| → | Go to next step (if completed) |

---

## Troubleshooting

### Pipeline won't advance
- ✅ Check step validation requirements
- ✅ Look for disabled Next button
- ✅ Complete all required actions

### Lost progress
- ✅ Check browser console for errors
- ✅ Verify localStorage is enabled
- ✅ Check network connectivity

### Step shows wrong status
- ✅ Refresh the page
- ✅ Check cycleData state
- ✅ Verify canProgress() logic

---

## Development Notes

### Adding New Step Actions

```typescript
// In step component
const handleAction = async () => {
  // Your logic here
  
  // Update state
  onDataChange((prev) => ({
    ...prev,
    yourNewField: value
  }))
  
  // Optionally advance
  onNext()
}
```

### Integrating with API

```typescript
// Replace simulated processing
const response = await axios.post(APIV3Dictionary.payroll.yourEndpoint, data)

if (response.data.success) {
  onDataChange((prev) => ({...prev, ...response.data.cycle}))
  onNext()
}
```

---

## Files Location

```
frontend/src/pages/private/system/PayrollManagementSystem/New_version/AdminLevel/
├── PayrollPipelinePage.tsx              ← Main page
├── components/
│   ├── PipelineVisualization.tsx        ← Visual indicator
│   └── steps/
│       ├── CreateCycleStep.tsx          ← Step 1 (API integrated)
│       ├── SetupStep.tsx                ← Step 2
│       ├── ProcessingStep.tsx           ← Step 3
│       ├── ReviewStep.tsx               ← Step 4
│       ├── ApprovalStep.tsx             ← Step 5
│       └── PayoutStep.tsx               ← Step 6
```

---

## Quick Reference

### CycleData Fields

```typescript
{
  // Step 1
  cycle: object,
  cycleId: string,
  month: number,
  year: number,
  
  // Step 2
  setupComplete: boolean,
  employeesVerified: boolean,
  attendanceImported: boolean,
  
  // Step 3
  processingStarted: boolean,
  allProcessed: boolean,
  processingProgress: number,
  processedCount: number,
  failedCount: number,
  
  // Step 4
  reviewStarted: boolean,
  allReviewed: boolean,
  reviewedCount: number,
  approvedCount: number,
  rejectedCount: number,
  
  // Step 5
  approved: boolean,
  approvedAt: string,
  cycleStatus: string,
  locked: boolean,
  
  // Step 6
  payoutInitiated: boolean,
  payoutComplete: boolean,
  payoutInitiatedAt: string,
  payoutStatus: string,
  payoutProgress: number
}
```

---

## Need Help?

- 📄 See `PIPELINE_IMPLEMENTATION_COMPLETE.md` for full docs
- 📄 See `PIPELINE_STEPS_INTEGRATION_COMPLETE.md` for detailed integration guide
- 🔧 Check console for error messages
- 💬 Ask the team!

---

**Happy Processing!** 🚀
