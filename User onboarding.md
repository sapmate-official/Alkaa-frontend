# Enhanced User Onboarding Process - Technical Implementation Plan

## Overview

This implementation plan outlines a multi-stage onboarding process for new employees that:
1. Allows HR/managers to initiate onboarding with minimal information
2. Engages candidates through self-service information entry
3. Facilitates manager review and verification
4. Streamlines department/role assignment
5. Completes the onboarding process with proper notifications

## Database Schema Changes

### 1. New Table: `OnboardingCandidate`

```sql
CREATE TABLE OnboardingCandidate (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255),
  mobileNumber VARCHAR(20),
  status ENUM('INVITED', 'FORM_SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'APPROVED', 'ONBOARDED') DEFAULT 'INVITED',
  formData JSON,
  verificationToken VARCHAR(255),
  tokenExpiry TIMESTAMP,
  orgId VARCHAR(36) NOT NULL,
  createdById VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  formSubmittedAt TIMESTAMP NULL,
  reviewedById VARCHAR(36) NULL,
  reviewedAt TIMESTAMP NULL,
  rejectionReason TEXT NULL,
  FOREIGN KEY (orgId) REFERENCES Organization(id),
  FOREIGN KEY (createdById) REFERENCES User(id),
  FOREIGN KEY (reviewedById) REFERENCES User(id)
);
```

### 2. Prisma Schema Update

```prisma
model OnboardingCandidate {
  id              String    @id @default(uuid())
  email           String    @unique
  firstName       String
  lastName        String?
  mobileNumber    String?
  status          OnboardingStatus @default(INVITED)
  formData        Json?
  verificationToken String?
  tokenExpiry     DateTime?
  orgId           String
  createdById     String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  formSubmittedAt DateTime?
  reviewedById    String?
  reviewedAt      DateTime?
  rejectionReason String?
  
  organization    Organization @relation(fields: [orgId], references: [id])
  createdBy       User @relation("CreatedCandidates", fields: [createdById], references: [id])
  reviewedBy      User? @relation("ReviewedCandidates", fields: [reviewedById], references: [id])
}

enum OnboardingStatus {
  INVITED
  FORM_SUBMITTED
  UNDER_REVIEW
  REJECTED
  APPROVED
  ONBOARDED
}
```

## Backend API Endpoints

### 1. Candidate Management Endpoints

#### Create Initial Candidate

```javascript
// POST /api/v2/onboarding/candidates
const createCandidate = async (req, res) => {
  try {
    // Validate permission
    const hasPermission = await checkPermission(req.user.id, 'create_user');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const { email, firstName, lastName, mobileNumber } = req.body;
    
    // Check if email exists in users or candidates
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingCandidate = await prisma.onboardingCandidate.findUnique({ where: { email } });
    
    if (existingUser || existingCandidate) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const candidate = await prisma.onboardingCandidate.create({
      data: {
        email,
        firstName,
        lastName,
        mobileNumber,
        status: 'INVITED',
        verificationToken,
        tokenExpiry,
        orgId: req.user.orgId,
        createdById: req.user.id
      }
    });
    
    res.status(201).json({
      message: 'Candidate created successfully',
      candidate: {
        id: candidate.id,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        status: candidate.status
      }
    });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### Get All Candidates

```javascript
// GET /api/v2/onboarding/candidates
const getCandidates = async (req, res) => {
  try {
    const { status } = req.query;
    
    const whereClause = {
      orgId: req.user.orgId,
      ...(status ? { status } : {})
    };
    
    const candidates = await prisma.onboardingCandidate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    res.status(200).json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### Send Invitation Email

```javascript
// POST /api/v2/onboarding/candidates/:id/invite
const sendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidate = await prisma.onboardingCandidate.findUnique({
      where: { id },
      include: {
        organization: true
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (candidate.orgId !== req.user.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Regenerate token if needed
    let verificationToken = candidate.verificationToken;
    let tokenExpiry = candidate.tokenExpiry;
    
    if (!verificationToken || new Date(tokenExpiry) < new Date()) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await prisma.onboardingCandidate.update({
        where: { id },
        data: { verificationToken, tokenExpiry }
      });
    }
    
    // Send invitation email
    const onboardingUrl = `${process.env.CLIENT_URL}/onboarding/${verificationToken}`;
    
    await sendOnboardingInvitationEmail(
      candidate.email,
      candidate.firstName,
      onboardingUrl,
      candidate.organization.name
    );
    
    // Update candidate status if needed
    if (candidate.status !== 'INVITED') {
      await prisma.onboardingCandidate.update({
        where: { id },
        data: { status: 'INVITED' }
      });
    }
    
    res.status(200).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### Verify Token & Get Candidate Form

```javascript
// GET /api/v2/onboarding/verify/:token
const verifyOnboardingToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const candidate = await prisma.onboardingCandidate.findFirst({
      where: {
        verificationToken: token,
        tokenExpiry: { gt: new Date() }
      },
      include: {
        organization: {
          select: {
            name: true,
            industry: true,
            logo: true
          }
        }
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }
    
    res.status(200).json({
      candidateId: candidate.id,
      email: candidate.email,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      mobileNumber: candidate.mobileNumber,
      organizationName: candidate.organization.name,
      organizationIndustry: candidate.organization.industry,
      organizationLogo: candidate.organization.logo,
      formData: candidate.formData || null,
      status: candidate.status
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### Submit Candidate Form

```javascript
// POST /api/v2/onboarding/submit/:token
const submitCandidateForm = async (req, res) => {
  try {
    const { token } = req.params;
    const formData = req.body;
    
    const candidate = await prisma.onboardingCandidate.findFirst({
      where: {
        verificationToken: token,
        tokenExpiry: { gt: new Date() }
      },
      include: {
        organization: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }
    
    // Update candidate with form data
    const updatedCandidate = await prisma.onboardingCandidate.update({
      where: { id: candidate.id },
      data: {
        formData,
        status: 'FORM_SUBMITTED',
        formSubmittedAt: new Date()
      }
    });
    
    // Send notification to the manager who created the candidate
    await prisma.notification.create({
      data: {
        userId: candidate.createdBy.id,
        content: `${candidate.firstName} ${candidate.lastName} has submitted their onboarding form.`,
        metadata: {
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          type: 'ONBOARDING_SUBMISSION'
        },
        isRead: false
      }
    });
    
    res.status(200).json({
      message: 'Form submitted successfully',
      status: updatedCandidate.status
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### 2. Manager Review Endpoints

#### Review Candidate

```javascript
// GET /api/v2/onboarding/candidates/:id/review
const getCandidateForReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidate = await prisma.onboardingCandidate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (candidate.orgId !== req.user.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.status(200).json(candidate);
  } catch (error) {
    console.error('Error fetching candidate for review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### Approve Candidate Form

```javascript
// POST /api/v2/onboarding/candidates/:id/approve
const approveCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidate = await prisma.onboardingCandidate.findUnique({
      where: { id },
      include: {
        organization: true
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (candidate.orgId !== req.user.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (candidate.status !== 'FORM_SUBMITTED' && candidate.status !== 'UNDER_REVIEW') {
      return res.status(400).json({ error: 'Candidate is not in reviewable state' });
    }
    
    // Update candidate status
    await prisma.onboardingCandidate.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: req.user.id,
        reviewedAt: new Date()
      }
    });
    
    res.status(200).json({ message: 'Candidate approved successfully' });
  } catch (error) {
    console.error('Error approving candidate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### Request Changes from Candidate

```javascript
// POST /api/v2/onboarding/candidates/:id/request-changes
const requestChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required' });
    }
    
    const candidate = await prisma.onboardingCandidate.findUnique({
      where: { id },
      include: {
        organization: true
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (candidate.orgId !== req.user.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Regenerate token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Update candidate status
    await prisma.onboardingCandidate.update({
      where: { id },
      data: {
        status: 'INVITED',
        verificationToken,
        tokenExpiry,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
        rejectionReason: feedback
      }
    });
    
    // Send feedback email with new token
    const onboardingUrl = `${process.env.CLIENT_URL}/onboarding/${verificationToken}`;
    
    await sendOnboardingChangeRequestEmail(
      candidate.email,
      candidate.firstName,
      onboardingUrl,
      feedback,
      candidate.organization.name,
      `${req.user.firstName} ${req.user.lastName}`
    );
    
    res.status(200).json({ message: 'Change request sent successfully' });
  } catch (error) {
    console.error('Error requesting changes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### Complete Onboarding

```javascript
// POST /api/v2/onboarding/candidates/:id/complete
const completeOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId, roleId } = req.body;
    
    if (!departmentId || !roleId) {
      return res.status(400).json({ error: 'Department and Role are required' });
    }
    
    const candidate = await prisma.onboardingCandidate.findUnique({
      where: { id },
      include: {
        organization: true
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (candidate.orgId !== req.user.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (candidate.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Candidate is not approved yet' });
    }
    
    // Extract required fields from formData
    const formData = candidate.formData;
    
    // Generate employee ID
    const organization = candidate.organization;
    const date = new Date();
    const nameInitials = organization.name.split(' ').map(word => word.charAt(0)).join('');
    const employeeId = nameInitials + 
      date.getFullYear().toString().slice(-2) + 
      (date.getMonth() + 1).toString().padStart(2, '0') +
      Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Create user from candidate
    const user = await prisma.user.create({
      data: {
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        mobileNumber: candidate.mobileNumber,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
        adharNumber: formData.adharNumber,
        panNumber: formData.panNumber,
        employeeId,
        orgId: candidate.orgId,
        departmentId,
        status: 'active',
        hiredDate: new Date(),
        roles: {
          create: [{
            roleId
          }]
        }
      }
    });
    
    // Create bank details if provided
    if (formData.bankDetails) {
      await prisma.bankDetails.create({
        data: {
          userId: user.id,
          accountNumber: formData.bankDetails.accountNumber,
          ifscCode: formData.bankDetails.ifscCode,
          bankName: formData.bankDetails.bankName,
          branchName: formData.bankDetails.branchName,
          accountHolderName: formData.bankDetails.accountHolderName
        }
      });
    }
    
    // Update candidate status
    await prisma.onboardingCandidate.update({
      where: { id },
      data: {
        status: 'ONBOARDED'
      }
    });
    
    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: resetToken,
        verificationTokenExpiry: resetTokenExpiry
      }
    });
    
    // Send welcome email
    const loginUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    await sendEmployeeWelcomeEmail(
      user.email,
      user.firstName,
      loginUrl,
      employeeId,
      organization.name
    );
    
    res.status(200).json({
      message: 'Onboarding completed successfully',
      user: {
        id: user.id,
        email: user.email,
        employeeId
      }
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

## Email Templates

### 1. Invitation Email

```javascript
export const sendOnboardingInvitationEmail = async (email, firstName, onboardingUrl, companyName) => {
  try {
    const emailData = {
      sender: {
        name: companyName,
        email: process.env.SENDER_EMAIL
      },
      to: [{
        email,
        name: firstName
      }],
      subject: `Welcome to ${companyName} - Complete Your Onboarding`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; text-align: center;">Welcome to ${companyName}!</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #636363; margin-bottom: 15px;">
              Hello ${firstName},
            </p>
            
            <p style="color: #636363; margin-bottom: 15px;">
              We're excited to have you join our team at ${companyName}! To complete your onboarding process, 
              please click the button below to provide some additional information we need to set up your account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${onboardingUrl}"
                 style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
                 Complete Your Onboarding
              </a>
            </div>
            
            <p style="color: #636363; margin-bottom: 15px;">
              This link will expire in 7 days. If you have any questions, please contact your hiring manager.
            </p>
            
            <p style="font-size: 12px; color: #636363;">
              If you did not expect this email, please ignore it.
            </p>
          </div>
        </div>
      `
    };

    return await sendBrevoEmail(emailData);
  } catch (error) {
    console.error('Error sending onboarding invitation email:', error);
    return error;
  }
};
```

### 2. Change Request Email

```javascript
export const sendOnboardingChangeRequestEmail = async (email, firstName, onboardingUrl, feedback, companyName, managerName) => {
  try {
    const emailData = {
      sender: {
        name: companyName,
        email: process.env.SENDER_EMAIL
      },
      to: [{
        email,
        name: firstName
      }],
      subject: `Action Required: Update Your Onboarding Information`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; text-align: center;">Onboarding Information Update</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #636363; margin-bottom: 15px;">
              Hello ${firstName},
            </p>
            
            <p style="color: #636363; margin-bottom: 15px;">
              Thank you for submitting your information. We need a few changes to complete your onboarding process. 
              Please review the feedback below and update your information:
            </p>
            
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
              <p style="margin: 0; color: #636363;">
                <strong>Feedback from ${managerName}:</strong><br>
                ${feedback}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${onboardingUrl}"
                 style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
                 Update Your Information
              </a>
            </div>
            
            <p style="color: #636363; margin-bottom: 15px;">
              This link will expire in 7 days. If you have any questions, please contact your hiring manager.
            </p>
          </div>
        </div>
      `
    };

    return await sendBrevoEmail(emailData);
  } catch (error) {
    console.error('Error sending onboarding change request email:', error);
    return error;
  }
};
```

### 3. Welcome Email

```javascript
export const sendEmployeeWelcomeEmail = async (email, firstName, loginUrl, employeeId, companyName) => {
  try {
    const emailData = {
      sender: {
        name: companyName,
        email: process.env.SENDER_EMAIL
      },
      to: [{
        email,
        name: firstName
      }],
      subject: `Welcome to ${companyName} - Your Onboarding is Complete!`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; text-align: center;">Welcome to ${companyName}!</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #636363; margin-bottom: 15px;">
              Hello ${firstName},
            </p>
            
            <p style="color: #636363; margin-bottom: 15px;">
              Congratulations! Your onboarding process is complete, and your account has been set up in our HR system.
            </p>
            
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
              <p style="margin: 0; color: #636363;">
                <strong>Your Employee ID:</strong> ${employeeId}<br>
                <strong>Email:</strong> ${email}
              </p>
            </div>
            
            <p style="color: #636363; margin-bottom: 15px;">
              To get started, please set your password by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}"
                 style="background-color: #2ecc71; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
                 Set Your Password
              </a>
            </div>
            
            <p style="color: #636363; margin-bottom: 15px;">
              After setting your password, you can log in to our HR portal at <a href="${process.env.CLIENT_URL}" style="color: #3498db; text-decoration: none;">${process.env.CLIENT_URL}</a> using your email and password.
            </p>
            
            <p style="color: #636363; margin-bottom: 15px;">
              This link will expire in 24 hours for security reasons.
            </p>
          </div>
        </div>
      `
    };

    return await sendBrevoEmail(emailData);
  } catch (error) {
    console.error('Error sending employee welcome email:', error);
    return error;
  }
};
```

## Frontend Components

### 1. Admin/Manager Interface

#### Candidate Creation Form

Create a form component in the HR dashboard for managers to quickly add new candidates with minimal information.

#### Candidate List & Management

Create a dashboard view showing all candidates in various stages with appropriate actions.

### 2. Candidate Onboarding Form

Create a comprehensive form for candidates to complete with various sections.

### 3. Manager Review Interface

Create an interface for managers to review candidate submissions and take appropriate actions.

## Frontend Routes

```javascript
// Public routes (no auth required)
<Route path="/onboarding/:token" element={<OnboardingForm />} />

// Protected routes (auth required)
<Route path="/hr/onboarding" element={<OnboardingDashboard />} />
<Route path="/hr/onboarding/new" element={<NewCandidate />} />
<Route path="/hr/onboarding/:id/review" element={<CandidateReview />} />
<Route path="/hr/onboarding/:id/complete" element={<CompleteOnboarding />} />
```

## Notification System

### 1. Real-time Notifications

Implement WebSocket notifications for managers when candidates submit or update their forms.

### 2. Email Notifications

Send email notifications at key points in the workflow:
- Initial invitation to candidate
- Confirmation to candidate after form submission
- Notification to manager when form is submitted
- Change request to candidate
- Completion of onboarding to candidate

## Workflow States & Transitions

1. **INVITED**: Initial state after creation
   - Next: FORM_SUBMITTED (when candidate completes form)

2. **FORM_SUBMITTED**: Candidate has completed the form
   - Next: UNDER_REVIEW (when manager starts review)
   - Next: REJECTED (if immediate rejection)

3. **UNDER_REVIEW**: Manager is reviewing the submission
   - Next: APPROVED (if information is correct)
   - Next: INVITED (if changes requested)

4. **REJECTED**: Candidate is rejected
   - Terminal state

5. **APPROVED**: Information is verified, ready for department/role assignment
   - Next: ONBOARDED (when department/role assigned and final email sent)

6. **ONBOARDED**: Process complete, user account created
   - Terminal state

## Security Considerations

1. **Token Security**:
   - Generate cryptographically secure tokens
   - Implement token expiration
   - Single-use token validation

2. **Data Protection**:
   - Validate and sanitize all form inputs
   - Encrypt sensitive data in database
   - Implement proper permission checks

3. **Rate Limiting**:
   - Add rate limiting to public endpoints
   - Prevent brute force attacks on token validation

## Testing Plan

1. **Unit Tests**:
   - Test token generation and validation
   - Test email template rendering
   - Test permission checks

2. **Integration Tests**:
   - Test the complete candidate flow
   - Test manager review processes
   - Test onboarding completion

3. **End-to-End Tests**:
   - Test the entire workflow from invitation to onboarding

## Deployment Strategy

1. **Database Migration**:
   - Create migration script for new tables and fields
   - Include rollback capability

2. **Feature Flags**:
   - Deploy with feature flag to enable/disable the new flow
   - Allow gradual rollout to specific organizations

3. **Monitoring**:
   - Add logging to key points in the flow
   - Create dashboard to monitor onboarding metrics

## Implementation Timeline

1. **Week 1**:
   - Database schema implementation
   - Basic API endpoints for candidate creation and listing
   - Initial frontend for manager dashboard

2. **Week 2**:
   - Candidate form submission flow
   - Email notifications
   - Manager review interface

3. **Week 3**:
   - Complete onboarding process
   - Security review and testing
   - UI/UX refinements

4. **Week 4**:
   - End-to-end testing
   - Documentation
   - Deployment preparation