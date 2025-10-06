# Workflow Tab Visual Structure

## Tab Layout (7 Tabs Total)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Overview] [Cycles] [Processing] [Review] [Workflow] [Transactions] [Settings]  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Workflow Tab Content

```
╔═══════════════════════════════════════════════════════════════════════╗
║                          WORKFLOW TAB                                  ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │  Workflow Overview                            [🔄 Refresh]   │    ║
║  │  Setup & Configuration - 12/2024                             │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │                                                               │    ║
║  │  Overall Progress                                   65%      │    ║
║  │  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱                                   │    ║
║  │                                                               │    ║
║  │  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐      │    ║
║  │  │   3    │ │    5     │ │    1    │ │   Setup      │      │    ║
║  │  │ Active │ │Completed │ │ Blocked │ │    Phase     │      │    ║
║  │  └────────┘ └──────────┘ └─────────┘ └──────────────┘      │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │  🔵 Setup & Configuration               3/5 completed        │    ║
║  │  ▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱                                            │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  ✅  Configure Payroll Templates         [Completed]        │    ║
║  │      Setup salary structure and components                   │    ║
║  │      Assigned: admin@example.com | Est: 2h                   │    ║
║  │      Completed by: John Doe                      [Update]    │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  🔵  Employee Data Verification         [In Progress]        │    ║
║  │      Verify employee master data and attendance              │    ║
║  │      Assigned: hr@example.com | Est: 3h          [Update]    │    ║
║  │      💬 "Waiting for attendance data from Dept A"            │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  ⏱️  Update Salary Components              [Pending]        │    ║
║  │      Apply changes to salary structure                       │    ║
║  │      Assigned: payroll@example.com | Est: 1h    [Update]    │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │  🟣 Payroll Cycle                        2/3 completed        │    ║
║  │  ▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱                                            │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  ✅  Start Payroll Cycle                 [Completed]         │    ║
║  │      Initialize payroll processing for the month             │    ║
║  │      Assigned: system | Est: 0.5h                [Update]    │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  🔵  Calculate Salaries                 [In Progress]        │    ║
║  │      Process salary calculations for all employees           │    ║
║  │      Assigned: system | Est: 1h                  [Update]    │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  ❌  Process Deductions                    [Blocked]         │    ║
║  │      Calculate and apply deductions                          │    ║
║  │      Assigned: payroll@example.com | Est: 1.5h  [Update]    │    ║
║  │      💬 "Blocked: Waiting for tax updates"                   │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │  🟡 Review & Approval                    0/1 completed        │    ║
║  │  ▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱                                            │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  ⏱️  Review and Approve                    [Pending]         │    ║
║  │      Manager review and approval of payroll                  │    ║
║  │      Assigned: manager@example.com | Est: 2h    [Update]    │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │  🟢 Reporting & Payouts                  0/2 completed        │    ║
║  │  ▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱                                            │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  ⏱️  Generate Reports                      [Pending]         │    ║
║  │      Create payroll reports and summaries                    │    ║
║  │      Assigned: system | Est: 0.5h               [Update]    │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  ⏱️  Process Payouts                       [Pending]         │    ║
║  │      Execute payment transactions                            │    ║
║  │      Assigned: finance@example.com | Est: 3h    [Update]    │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │  🩷 Employee Services                    0/1 completed        │    ║
║  │  ▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱                                            │    ║
║  ├──────────────────────────────────────────────────────────────┤    ║
║  │  ⏱️  Distribute Payslips                   [Pending]         │    ║
║  │      Send payslips to employees                              │    ║
║  │      Assigned: system | Est: 0.5h               [Update]    │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Update Step Dialog

```
┌─────────────────────────────────────────────────────────────┐
│  Update Workflow Step                          [✕]          │
│  Employee Data Verification                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Status                                                      │
│  ┌────────────────────────────────────────┐                 │
│  │  In Progress                     ▼    │                 │
│  └────────────────────────────────────────┘                 │
│                                                              │
│  Comments (Optional)                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Waiting for attendance data from Department A          │ │
│  │ Will resume once data is received                      │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                                                              │
│                                   [Cancel]  [Update Step]   │
└─────────────────────────────────────────────────────────────┘
```

## Empty State (No Workflow)

```
┌─────────────────────────────────────────────────────────────┐
│  Initialize Workflow                                         │
│                                                              │
│  No workflow found for 12/2024. Initialize a new            │
│  workflow to get started.                                   │
│                                                              │
│                                                              │
│  [+ Initialize Workflow]                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Color Legend

### Phase Colors
- 🔵 **Blue** = Setup & Configuration
- 🟣 **Purple** = Payroll Cycle
- 🟡 **Amber** = Review & Approval
- 🟢 **Emerald** = Reporting & Payouts
- 🩷 **Pink** = Employee Services

### Status Indicators
- ✅ **Green** = Completed
- 🔵 **Blue** = In Progress
- ⏱️ **Gray** = Pending
- ❌ **Red** = Blocked

## Data Flow

```
┌────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                          │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   WorkflowTab.tsx                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  fetchWorkflowData()                                 │ │
│  │  - GET /workflow/status                              │ │
│  │  - GET /workflow/steps                               │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  handleUpdateStep()                                  │ │
│  │  - PUT /workflow/steps/:stepId                       │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  initializeWorkflow()                                │ │
│  │  - POST /workflow/initialize                         │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│              APIV3Dictionary.payroll.workflow              │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│          /api/v3/payroll/workflow/* endpoints              │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│               workflowController.js                        │
│  - getWorkflowStatus()                                     │
│  - getWorkflowSteps()                                      │
│  - updateWorkflowStep()                                    │
│  - getWorkflowProgress()                                   │
│  - initializeWorkflow()                                    │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│            Prisma Client (ORM)                             │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│        PostgreSQL Database (WorkflowStep table)            │
└────────────────────────────────────────────────────────────┘
```

## Component Tree

```
PayrollAdminDashboard
├── Header
│   └── Tab Navigation (7 tabs)
│       ├── Overview
│       ├── Cycles
│       ├── Processing
│       ├── Review
│       ├── Workflow ← NEW
│       ├── Transactions
│       └── Settings
└── Tab Content
    └── WorkflowTab (when activeTab === 'workflow')
        ├── Workflow Overview Card
        │   ├── Current Phase Badge
        │   ├── Progress Bar
        │   └── Statistics Grid
        │       ├── Active Steps
        │       ├── Completed Steps
        │       ├── Blocked Steps
        │       └── Current Phase
        ├── Phase Cards (5 phases)
        │   ├── Phase Header
        │   │   ├── Phase Name + Badge
        │   │   └── Phase Progress Bar
        │   └── Step Cards (multiple)
        │       ├── Status Icon
        │       ├── Title + Status Badge
        │       ├── Description
        │       ├── Metadata (assigned, hours)
        │       ├── Comments Section
        │       └── Update Button
        └── Update Step Dialog
            ├── Status Dropdown
            ├── Comments Textarea
            └── Action Buttons
```

## Responsive Breakpoints

```
Desktop (≥ 768px)
┌───────────────────────────────────────┐
│  Statistics: 4 columns                │
│  Phase cards: Full width              │
│  Step cards: Full details visible     │
└───────────────────────────────────────┘

Tablet (< 768px)
┌─────────────────────┐
│  Statistics: 2x2     │
│  Phase cards: Stack  │
│  Step cards: Compact │
└─────────────────────┘

Mobile (< 640px)
┌──────────────┐
│  Stats: 1col │
│  Cards: Full │
│  Scroll: Y   │
└──────────────┘
```

## Status Transition Flow

```
┌─────────┐
│ PENDING │ ──────┐
└─────────┘       │
                  ▼
              ┌──────────────┐         ┌───────────┐
              │ IN_PROGRESS  │ ───────▶│ COMPLETED │
              └──────────────┘         └───────────┘
                  │
                  │
                  ▼
              ┌─────────┐
              │ BLOCKED │
              └─────────┘
```

## Future Enhancement Areas

```
Current Implementation
    │
    ├── ✅ View workflow status
    ├── ✅ Initialize workflow
    ├── ✅ Update step status
    ├── ✅ Add comments
    ├── ✅ Track completion
    └── ✅ Phase organization

Future Enhancements
    │
    ├── 🔮 Dependency validation
    ├── 🔮 Email notifications
    ├── 🔮 Custom templates
    ├── 🔮 Time tracking
    ├── 🔮 Workflow analytics
    ├── 🔮 Document attachments
    ├── 🔮 Role-based access
    └── 🔮 Audit logs view
```
