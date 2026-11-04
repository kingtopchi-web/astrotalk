const Razorpay = require('razorpay');
const Setting = require('../models/Setting');

class RazorpayAccountService {
  constructor() {
    this.accountCodes = ['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3'];
    this.clientCache = new Map();
  }

  /**
   * Securely retrieve environment credentials for an account code.
   * Internal to backend services only - NEVER expose secrets to clients or logs.
   */
  getCredentials(accountCode) {
    switch (accountCode) {
      case 'RAZORPAY_1':
        return {
          keyId: (process.env.RAZORPAY_1_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim(),
          keySecret: (process.env.RAZORPAY_1_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '').trim(),
          webhookSecret: (process.env.RAZORPAY_1_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
          accountNumber: (process.env.RAZORPAY_1_ACCOUNT_NUMBER || process.env.RAZORPAY_ACCOUNT_NUMBER || '').trim()
        };
      case 'RAZORPAY_2':
        return {
          keyId: (process.env.RAZORPAY_2_KEY_ID || '').trim(),
          keySecret: (process.env.RAZORPAY_2_KEY_SECRET || '').trim(),
          webhookSecret: (process.env.RAZORPAY_2_WEBHOOK_SECRET || '').trim(),
          accountNumber: (process.env.RAZORPAY_2_ACCOUNT_NUMBER || '').trim()
        };
      case 'RAZORPAY_3':
        return {
          keyId: (process.env.RAZORPAY_3_KEY_ID || '').trim(),
          keySecret: (process.env.RAZORPAY_3_KEY_SECRET || '').trim(),
          webhookSecret: (process.env.RAZORPAY_3_WEBHOOK_SECRET || '').trim(),
          accountNumber: (process.env.RAZORPAY_3_ACCOUNT_NUMBER || '').trim()
        };
      default:
        throw new Error(`Unknown Razorpay account code: ${accountCode}`);
    }
  }

  /**
   * Determine live vs test mode safely from Key ID prefix
   */
  getModeFromKeyId(keyId) {
    if (!keyId) return 'not_configured';
    if (keyId.startsWith('rzp_live_')) return 'live';
    if (keyId.startsWith('rzp_test_')) return 'test';
    return 'unknown';
  }

  /**
   * Load platform Razorpay configuration from database settings
   */
  async getSettings() {
    let setting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    if (!setting) {
      setting = await Setting.create({ singletonKey: 'GLOBAL_SETTINGS' });
    }

    // Default accounts metadata template
    const defaultMeta = {
      RAZORPAY_1: { displayName: 'Primary Merchant Account', isEnabled: true, payoutEnabled: true },
      RAZORPAY_2: { displayName: 'Secondary Merchant Account', isEnabled: true, payoutEnabled: false },
      RAZORPAY_3: { displayName: 'Payouts & Operations Account', isEnabled: true, payoutEnabled: true },
    };

    const currentAccounts = setting.razorpayAccounts || [];
    const accountsMap = {};
    currentAccounts.forEach(acc => {
      accountsMap[acc.accountCode] = acc;
    });

    const mergedAccounts = this.accountCodes.map(code => {
      const fromDb = accountsMap[code];
      const defaults = defaultMeta[code];
      return {
        accountCode: code,
        displayName: fromDb?.displayName || defaults.displayName,
        isEnabled: fromDb !== undefined ? !!fromDb.isEnabled : defaults.isEnabled,
        payoutEnabled: fromDb !== undefined ? !!fromDb.payoutEnabled : defaults.payoutEnabled,
        updatedAt: fromDb?.updatedAt || setting.updatedAt || new Date()
      };
    });

    return {
      defaultPaymentAccount: setting.defaultPaymentAccount || 'RAZORPAY_1',
      defaultPayoutAccount: setting.defaultPayoutAccount || 'RAZORPAY_1',
      enablePaymentFallback: !!setting.enablePaymentFallback,
      minPayoutAmount: setting.minPayoutAmount || 100,
      accounts: mergedAccounts,
      auditLogs: (setting.razorpayAuditLogs || []).slice(-50).reverse()
    };
  }

  /**
   * Return sanitized summary of all three accounts for Admin UI
   * Never includes secret keys or webhook secrets
   */
  async getSanitizedAccountList() {
    const settings = await this.getSettings();

    return settings.accounts.map(acc => {
      const creds = this.getCredentials(acc.accountCode);
      const isGatewayConfigured = !!(creds.keyId && creds.keySecret);
      const isPayoutConfigured = !!(creds.keyId && creds.keySecret && creds.accountNumber);
      const mode = this.getModeFromKeyId(creds.keyId);

      return {
        accountCode: acc.accountCode,
        displayName: acc.displayName,
        keyId: creds.keyId || null,
        mode,
        paymentGatewayConfigured: isGatewayConfigured,
        payoutConfigured: isPayoutConfigured,
        isEnabled: acc.isEnabled,
        payoutEnabled: acc.payoutEnabled && isPayoutConfigured,
        isDefaultPayment: settings.defaultPaymentAccount === acc.accountCode,
        isDefaultPayout: settings.defaultPayoutAccount === acc.accountCode,
        hasAccountNumber: !!creds.accountNumber,
        hasWebhookSecret: !!creds.webhookSecret,
        updatedAt: acc.updatedAt
      };
    });
  }

  /**
   * Get an instantiated Razorpay client for an account code.
   * Throws safe errors if not configured or disabled.
   */
  getClient(accountCode, allowDisabled = false) {
    if (!this.accountCodes.includes(accountCode)) {
      throw new Error(`Invalid Razorpay account code: ${accountCode}`);
    }

    const creds = this.getCredentials(accountCode);
    if (!creds.keyId || !creds.keySecret) {
      throw new Error(`Razorpay account [${accountCode}] credentials are not fully configured in environment variables.`);
    }

    // Return cached client if available
    const cacheKey = `${accountCode}_${creds.keyId}`;
    if (this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey);
    }

    const client = new Razorpay({
      key_id: creds.keyId,
      key_secret: creds.keySecret
    });

    this.clientCache.set(cacheKey, client);
    return client;
  }

  /**
   * Resolve default payment account for customer payments
   */
  async getDefaultPaymentAccount() {
    const settings = await this.getSettings();
    const defaultCode = settings.defaultPaymentAccount || 'RAZORPAY_1';

    const accountMeta = settings.accounts.find(a => a.accountCode === defaultCode);
    const creds = this.getCredentials(defaultCode);
    const isConfigured = !!(creds.keyId && creds.keySecret);

    if (accountMeta && accountMeta.isEnabled && isConfigured) {
      return {
        accountCode: defaultCode,
        keyId: creds.keyId,
        mode: this.getModeFromKeyId(creds.keyId),
        client: this.getClient(defaultCode)
      };
    }

    // Handle fallback if enabled
    if (settings.enablePaymentFallback) {
      for (const code of this.accountCodes) {
        if (code === defaultCode) continue;
        const candidateMeta = settings.accounts.find(a => a.accountCode === code);
        const candidateCreds = this.getCredentials(code);
        if (candidateMeta && candidateMeta.isEnabled && candidateCreds.keyId && candidateCreds.keySecret) {
          console.warn(`[RazorpayAccountService] Fallback payment account used: ${code} (default ${defaultCode} disabled/unconfigured)`);
          return {
            accountCode: code,
            keyId: candidateCreds.keyId,
            mode: this.getModeFromKeyId(candidateCreds.keyId),
            client: this.getClient(code),
            isFallback: true
          };
        }
      }
    }

    throw new Error(
      `Default Razorpay payment account [${defaultCode}] is ${
        !isConfigured ? 'not configured with credentials' : 'disabled by Admin'
      }. Fallback is ${settings.enablePaymentFallback ? 'enabled but no alternative available' : 'disabled'}.`
    );
  }

  /**
   * Resolve default payout account for expert withdrawals
   */
  async getDefaultPayoutAccount(overrideAccountCode = null) {
    const settings = await this.getSettings();
    const targetCode = overrideAccountCode || settings.defaultPayoutAccount || 'RAZORPAY_1';

    if (!this.accountCodes.includes(targetCode)) {
      throw new Error(`Invalid payout account code: ${targetCode}`);
    }

    const accountMeta = settings.accounts.find(a => a.accountCode === targetCode);
    const creds = this.getCredentials(targetCode);
    const isConfigured = !!(creds.keyId && creds.keySecret);

    if (!accountMeta || !accountMeta.isEnabled) {
      throw new Error(`Razorpay payout account [${targetCode}] is currently disabled by Admin.`);
    }

    if (!isConfigured) {
      throw new Error(`Razorpay payout account [${targetCode}] credentials are missing in environment variables.`);
    }

    return {
      accountCode: targetCode,
      keyId: creds.keyId,
      keySecret: creds.keySecret,
      accountNumber: creds.accountNumber,
      mode: this.getModeFromKeyId(creds.keyId),
      client: this.getClient(targetCode)
    };
  }

  /**
   * Safe connection test against Razorpay API
   */
  async testConnection(accountCode) {
    const startTime = Date.now();
    try {
      if (!this.accountCodes.includes(accountCode)) {
        return { success: false, accountCode, message: 'Invalid account code' };
      }

      const creds = this.getCredentials(accountCode);
      if (!creds.keyId || !creds.keySecret) {
        return {
          success: false,
          accountCode,
          message: 'Credentials missing in environment variables (Key ID or Key Secret)'
        };
      }

      const client = this.getClient(accountCode, true);
      // Execute lightweight API call (fetch 1 order)
      await client.orders.all({ count: 1 });
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        accountCode,
        mode: this.getModeFromKeyId(creds.keyId),
        latencyMs,
        message: `Successfully connected to Razorpay (${this.getModeFromKeyId(creds.keyId).toUpperCase()} mode) in ${latencyMs}ms.`
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = error?.error?.description || error?.message || 'Authentication failed';
      return {
        success: false,
        accountCode,
        latencyMs,
        message: `Connection failed: ${errorMsg}`
      };
    }
  }

  /**
   * Update accounts metadata, defaults, and audit logs
   */
  async updateSettings({ defaultPaymentAccount, defaultPayoutAccount, enablePaymentFallback, accounts, adminUser }) {
    let setting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    if (!setting) {
      setting = new Setting({ singletonKey: 'GLOBAL_SETTINGS' });
    }

    const previousState = {
      defaultPaymentAccount: setting.defaultPaymentAccount,
      defaultPayoutAccount: setting.defaultPayoutAccount,
      enablePaymentFallback: setting.enablePaymentFallback,
      accounts: setting.razorpayAccounts
    };

    if (defaultPaymentAccount && this.accountCodes.includes(defaultPaymentAccount)) {
      setting.defaultPaymentAccount = defaultPaymentAccount;
    }

    if (defaultPayoutAccount && this.accountCodes.includes(defaultPayoutAccount)) {
      setting.defaultPayoutAccount = defaultPayoutAccount;
    }

    if (typeof enablePaymentFallback === 'boolean') {
      setting.enablePaymentFallback = enablePaymentFallback;
    }

    if (Array.isArray(accounts)) {
      const existingAccounts = setting.razorpayAccounts || [];
      const updatedList = this.accountCodes.map(code => {
        const patch = accounts.find(a => a.accountCode === code);
        const existing = existingAccounts.find(a => a.accountCode === code);

        return {
          accountCode: code,
          displayName: patch?.displayName !== undefined ? patch.displayName : (existing?.displayName || code),
          isEnabled: patch?.isEnabled !== undefined ? !!patch.isEnabled : (existing !== undefined ? existing.isEnabled : true),
          payoutEnabled: patch?.payoutEnabled !== undefined ? !!patch.payoutEnabled : (existing?.payoutEnabled || false),
          updatedAt: new Date()
        };
      });
      setting.razorpayAccounts = updatedList;
    }

    // Append audit log
    if (!setting.razorpayAuditLogs) {
      setting.razorpayAuditLogs = [];
    }

    setting.razorpayAuditLogs.push({
      action: 'UPDATE_RAZORPAY_CONFIG',
      changedBy: adminUser?.email || adminUser?.name || 'admin',
      details: {
        newPaymentDefault: setting.defaultPaymentAccount,
        newPayoutDefault: setting.defaultPayoutAccount,
        enablePaymentFallback: setting.enablePaymentFallback,
        previousState: {
          paymentDefault: previousState.defaultPaymentAccount,
          payoutDefault: previousState.defaultPayoutAccount
        }
      },
      timestamp: new Date()
    });

    await setting.save();
    return this.getSanitizedAccountList();
  }
}

module.exports = new RazorpayAccountService();

