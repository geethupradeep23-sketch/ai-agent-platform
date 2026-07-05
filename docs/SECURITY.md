# 🔐 Security Guide

## Security Architecture

### Encryption Strategy

```
User Input
    ↓
Validation & Sanitization
    ↓
AES-256-GCM Encryption
    ↓
HMAC Authentication Tag
    ↓
Database Storage
    ↓
Encrypted Retrieval
    ↓
Decryption & Display
```

### Key Management

1. **Master Encryption Key**: Used for AES-256-GCM
   - Stored in environment variables
   - Never committed to version control
   - Rotated annually

2. **JWT Secrets**: Used for token generation
   - Refresh tokens expire in 7 days
   - Access tokens expire in 15 minutes
   - Signed with RS256 in production

3. **API Keys**: User-generated API keys
   - Hashed with bcrypt before storage
   - Rate limited per key
   - Can be revoked instantly

## Authentication & Authorization

### Multi-Factor Authentication (MFA)

```bash
# Enable 2FA
POST /api/v1/auth/mfa/setup

# Verify 2FA
POST /api/v1/auth/mfa/verify
```

### Role-Based Access Control (RBAC)

- **Admin**: Full platform access
- **User**: Personal data and agents only
- **API Key**: Limited scope access

### Row-Level Security (RLS)

PostgreSQL RLS policies ensure users can only access their own data:

```sql
CREATE POLICY user_isolation ON agents
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());
```

## Data Protection

### In Transit

- ✅ TLS 1.3 required in production
- ✅ HSTS headers enabled
- ✅ Certificate pinning recommended
- ✅ CORS properly configured

### At Rest

- ✅ AES-256-GCM encryption
- ✅ Encrypted database backups
- ✅ Encrypted file storage
- ✅ Secure key derivation

### In Memory

- ✅ Sensitive data cleared after use
- ✅ No sensitive data in logs
- ✅ Secure random number generation
- ✅ Memory-safe string handling

## Audit & Compliance

### Audit Logging

All actions are logged to `audit_logs` table:

```sql
SELECT action, resource_type, resource_id, details, created_at
FROM audit_logs
WHERE user_id = 'user-123'
ORDER BY created_at DESC;
```

### Compliance

- ✅ GDPR compliant (right to deletion)
- ✅ HIPAA ready (encryption at rest)
- ✅ SOC 2 aligned
- ✅ ISO 27001 standards

## Vulnerability Management

### Dependencies

```bash
# Check for vulnerabilities
npm audit
npm audit fix

# Using Snyk
snyk test
snyk protect
```

### Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Best Practices

### For Administrators

1. **Key Rotation**
   ```bash
   # Rotate encryption keys annually
   ./scripts/rotate-keys.sh
   ```

2. **Regular Backups**
   ```bash
   # Automated daily backups
   0 2 * * * /scripts/backup.sh
   ```

3. **Monitoring**
   - Monitor failed login attempts
   - Track API key usage
   - Review audit logs weekly

4. **Updates**
   ```bash
   # Keep dependencies updated
   npm update
   docker pull postgres:latest
   ```

### For Users

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols

2. **Enable 2FA**
   - Use TOTP authenticator app
   - Save backup codes safely

3. **API Key Security**
   - Use environment variables
   - Rotate API keys regularly
   - Delete unused keys

4. **Account Security**
   - Never share passwords
   - Logout from untrusted devices
   - Monitor active sessions

## Incident Response

### If Breach is Suspected

1. **Immediately**
   - Revoke all API keys
   - Force logout all sessions
   - Backup all data

2. **Within 24 Hours**
   - Review audit logs
   - Identify affected data
   - Notify users if needed

3. **Follow-up**
   - Rotate all encryption keys
   - Enable enhanced monitoring
   - Document incident details

## Security Checklist

### Pre-Deployment

- [ ] All environment variables are secrets
- [ ] No hardcoded credentials
- [ ] HTTPS configured
- [ ] Firewall rules set
- [ ] Database backups enabled
- [ ] SSL certificates valid
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Audit logging enabled

### Post-Deployment

- [ ] Monitor failed logins
- [ ] Check audit logs daily
- [ ] Verify backups work
- [ ] Test incident response
- [ ] Review access logs
- [ ] Update dependencies
- [ ] Rotate encryption keys
- [ ] Test disaster recovery

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Cryptography Standards](https://csrc.nist.gov/)
