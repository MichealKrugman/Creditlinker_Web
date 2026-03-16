

# The 20 Implementation Passes (MVP → Production Fintech)

These are the passes teams run before production.

---

# 1. Architecture Pass

Goal: understand the entire system.

Catalogue:

* services
* modules
* packages
* boundaries
* dependencies

Output should show:

```
Frontend
Backend
Database
Infrastructure
Integrations
Auth system
Admin system
```

This reveals **structural problems early**.

---

# 2. Domain Model Pass

Identify the **core business entities**.

Example for Creditlinker:

```
User
Business
Financer
CreditlinkerID
FinancialRecord
FinancingRequest
FinancingOffer
Transaction
Document
Integration
Notification
AuditLog
```

Goal: ensure domain model matches the business.

---

# 3. API Surface Pass

Catalogue every endpoint.

Example:

```
POST /auth/signup
POST /auth/login
GET /business/profile
POST /documents/upload
GET /financing/offers
POST /financing/accept
```

Find:

* missing endpoints
* unused endpoints
* inconsistent endpoints

---

# 4. State Machine Pass

Every important object must have states.

Example:

```
FinancingRequest

draft
submitted
under_review
approved
rejected
funded
```

Check that transitions are enforced.

---

# 5. Authentication Pass

Audit:

```
signup
login
logout
token refresh
password reset
email verification
```

Check for:

* token expiration
* session hijacking risks

---

# 6. Authorization Pass

Ensure role access works.

Roles example:

```
business
financer
admin
developer
```

Check:

```
who can access which endpoints
```

---

# 7. Admin System Pass

Admin systems must be isolated.

Check:

```
admin routes
admin permissions
admin logs
admin access controls
```

Admin activity must always be logged.

---

# 8. Database Integrity Pass

Check:

```
foreign keys
indexes
constraints
relationships
```

Find:

* orphan records
* duplicate tables
* bad schema design

---

# 9. Data Security Pass

Sensitive data must be protected.

Examples:

```
bank data
tax data
financial statements
identity documents
```

Ensure:

```
encryption
signed access
restricted retrieval
```

---

# 10. API Performance Pass

Look for:

```
N+1 queries
large responses
missing pagination
duplicate queries
```

Introduce:

```
caching
indexes
query batching
```

---

# 11. Rate Limiting Pass

Protect APIs.

Example:

```
login → 5 attempts/min
API → 100 requests/min
uploads → size limits
```

---

# 12. Error Handling Pass

Errors must be consistent.

Example:

Bad:

```
SQL syntax error
```

Good:

```
{ error: "internal_error" }
```

Never expose system details.

---

# 13. Logging Pass

Critical actions must be logged.

Example:

```
login attempts
admin actions
document uploads
financing approvals
data changes
```

---

# 14. Observability Pass

Ensure system monitoring exists.

Track:

```
API latency
server errors
failed requests
database performance
```

---

# 15. Dependency Pass

Scan for:

```
vulnerable packages
outdated libraries
unused dependencies
```

---

# 16. Frontend Integrity Pass

Check UI consistency.

Find:

```
stale buttons
dead links
missing API calls
duplicate components
```

---

# 17. Integration Pass

Verify external connections.

Examples:

```
accounting software
bank APIs
credit bureaus
payment processors
```

Check:

```
error handling
retry logic
timeouts
```

---

# 18. Data Pipeline Pass

For fintech products this is critical.

Ensure flow:

```
data ingestion
data normalization
risk indicators
financing signals
```

---

# 19. Abuse Scenario Pass

Simulate attackers.

Try:

```
fake financial uploads
API scraping
ID enumeration
mass application spam
```

Close these gaps.

---

# 20. Production Readiness Pass

Final audit:

```
environment variables
secrets
deployment config
CI/CD pipeline
backup strategy
disaster recovery
```

This pass determines **launch readiness**.

---

# Founder-Level System Map Prompt

This prompt is extremely powerful.

Give this to your AI agent.

```
You are acting as a principal software architect analyzing this entire repository.

Your goal is to reverse engineer the complete system architecture.

Scan the entire codebase and generate a full system map containing:

1. Backend architecture
   - services
   - modules
   - controllers
   - middleware
   - background jobs

2. API architecture
   - every endpoint
   - request parameters
   - response structures
   - authentication requirements

3. Database architecture
   - all tables
   - columns
   - relationships
   - indexes
   - constraints

4. Role and permission model
   - all user roles
   - access rules
   - protected routes
   - authorization logic

5. Domain model
   - all business entities
   - relationships between entities
   - lifecycle states

6. Frontend architecture
   - pages
   - components
   - API interactions
   - navigation flows

7. Integration architecture
   - external APIs
   - data ingestion
   - webhooks

8. Infrastructure assumptions
   - environment variables
   - storage systems
   - caching layers
   - background queues

Produce the result as a structured system catalogue so the entire product architecture can be understood without reading the code.

Also identify:

missing components
incomplete implementations
security risks
scaling risks
```

---

# The Second Prompt (Even More Powerful)

This makes the AI **design missing infrastructure**.

```
Based on the system architecture discovered in the codebase:

Identify all missing infrastructure required for a production-grade fintech platform.

Generate:

missing APIs
missing database tables
missing role permissions
missing logging systems
missing security protections
missing monitoring systems

Return a prioritized implementation roadmap.
```

---

# One Founder Insight For Creditlinker

Right now you’re trying to **finish implementation**.

But the real power move is this:

Run a **System Intelligence Pass**.

Ask the AI:

```
What financial signals can be extracted from the data model to determine financing readiness for a business?
```

That’s where **Creditlinker becomes valuable**.

Not the UI.

Not the APIs.

**The intelligence layer.**

