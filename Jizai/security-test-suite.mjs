#!/usr/bin/env node

/**
 * JIZAI セキュリティテストスイート
 * 本番デプロイ前のセキュリティ監査とペネトレーションテスト
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Simple glob implementation for our needs
function simpleGlob(pattern) {
  const files = [];
  
  function walk(dir) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  if (pattern.includes('src/**')) {
    walk('src');
    return files.filter(f => /\.(ts|tsx|js|jsx)$/.test(f));
  } else if (pattern.includes('backend/**')) {
    if (existsSync('backend')) {
      walk('backend');
      return files.filter(f => /\.(js|mjs)$/.test(f));
    }
  }
  
  return files;
}

class SecurityTester {
  constructor() {
    this.results = [];
    this.criticalIssues = [];
    this.warnings = [];
  }

  log(level, test, result, details = '') {
    const entry = { level, test, result, details, timestamp: new Date().toISOString() };
    this.results.push(entry);
    
    const emoji = level === 'CRITICAL' ? '🚨' : level === 'WARNING' ? '⚠️' : '✅';
    const color = level === 'CRITICAL' ? '\x1b[31m' : level === 'WARNING' ? '\x1b[33m' : '\x1b[32m';
    console.log(`${emoji} ${color}${level}\x1b[0m: ${test} - ${result}`);
    if (details) console.log(`   ${details}`);

    if (level === 'CRITICAL') this.criticalIssues.push(entry);
    if (level === 'WARNING') this.warnings.push(entry);
  }

  /**
   * 1. API Key露出テスト
   */
  async testApiKeyExposure() {
    console.log('\n🔍 API Key露出テスト');
    
    try {
      // フロントエンドコードでのAPI key検査
      const frontendFiles = simpleGlob('src/**/*.{ts,tsx,js,jsx}');
      const apiKeyPatterns = [
        /eyJ[A-Za-z0-9-_=]+/g,  // JWT tokens
        /sk-[a-zA-Z0-9]{48}/g,  // OpenAI style
        /pk_[a-zA-Z0-9]{24}/g,  // Stripe style
        /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']+["']/gi,
        /DASHSCOPE_API_KEY|SUPABASE_SERVICE_KEY/gi
      ];

      let foundKeys = false;
      for (const file of frontendFiles) {
        const content = readFileSync(file, 'utf8');
        for (const pattern of apiKeyPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            this.log('CRITICAL', 'API Key Exposure', 'FAILED', `Found potential API key in ${file}: ${matches[0].substring(0, 20)}...`);
            foundKeys = true;
          }
        }
      }

      if (!foundKeys) {
        this.log('PASS', 'API Key Exposure', 'PASSED', 'No API keys found in frontend code');
      }

      // 環境変数設定確認
      if (existsSync('.env')) {
        const envContent = readFileSync('.env', 'utf8');
        if (envContent.includes('VITE_') && (envContent.includes('api_key') || envContent.includes('secret'))) {
          this.log('CRITICAL', 'Environment Variables', 'FAILED', 'Sensitive data exposed via VITE_ variables');
        } else {
          this.log('PASS', 'Environment Variables', 'PASSED', 'No sensitive data in VITE_ variables');
        }
      }

    } catch (error) {
      this.log('WARNING', 'API Key Exposure', 'ERROR', error.message);
    }
  }

  /**
   * 2. 入力検証テスト
   */
  async testInputValidation() {
    console.log('\n🔍 入力検証テスト');

    // バックエンドコードの入力検証確認
    try {
      const backendFiles = simpleGlob('backend/**/*.{js,mjs}');
      let hasValidation = false;

      for (const file of backendFiles) {
        const content = readFileSync(file, 'utf8');
        
        // 入力検証パターンの確認
        const validationPatterns = [
          /\.trim\(\)\.length\s*[><=]/,  // 文字列長チェック
          /typeof\s+\w+\s*[!=]==?\s*["']string["']/,  // 型チェック
          /if\s*\(\s*!\w+\s*\|\|\s*typeof/,  // null/undefinedチェック
          /fileFilter|limits|fileSize/,  // ファイル検証
        ];

        for (const pattern of validationPatterns) {
          if (pattern.test(content)) {
            hasValidation = true;
            break;
          }
        }
      }

      if (hasValidation) {
        this.log('PASS', 'Input Validation', 'PASSED', 'Input validation found in backend code');
      } else {
        this.log('WARNING', 'Input Validation', 'WEAK', 'Limited input validation detected');
      }

    } catch (error) {
      this.log('WARNING', 'Input Validation', 'ERROR', error.message);
    }
  }

  /**
   * 3. XSS脆弱性テスト
   */
  async testXSSProtection() {
    console.log('\n🔍 XSS脆弱性テスト');

    try {
      // CSP設定確認
      if (existsSync('vercel.json')) {
        const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf8'));
        const cspHeader = vercelConfig.headers?.find(h => 
          h.headers?.some(header => header.key === 'Content-Security-Policy')
        );

        if (cspHeader) {
          const cspValue = cspHeader.headers.find(h => h.key === 'Content-Security-Policy')?.value;
          
          // 危険なCSP設定をチェック
          if (cspValue?.includes("'unsafe-inline'") && cspValue?.includes("'unsafe-eval'")) {
            this.log('WARNING', 'CSP Configuration', 'WEAK', 'Both unsafe-inline and unsafe-eval are allowed');
          } else if (cspValue?.includes("'unsafe-inline'")) {
            this.log('WARNING', 'CSP Configuration', 'WEAK', 'unsafe-inline is allowed');
          } else {
            this.log('PASS', 'CSP Configuration', 'PASSED', 'CSP configured with reasonable restrictions');
          }

          // XSS保護ヘッダー確認
          const xssHeader = cspHeader.headers.find(h => h.key === 'X-XSS-Protection');
          if (xssHeader && xssHeader.value.includes('1; mode=block')) {
            this.log('PASS', 'XSS Protection Header', 'PASSED', 'X-XSS-Protection properly configured');
          } else {
            this.log('WARNING', 'XSS Protection Header', 'MISSING', 'X-XSS-Protection not configured');
          }
        } else {
          this.log('CRITICAL', 'CSP Configuration', 'MISSING', 'No Content Security Policy configured');
        }
      }

      // フロントエンドでの危険なHTML操作確認
      const frontendFiles = simpleGlob('src/**/*.{ts,tsx,js,jsx}');
      let foundDangerousHtml = false;

      for (const file of frontendFiles) {
        const content = readFileSync(file, 'utf8');
        const dangerousPatterns = [
          /dangerouslySetInnerHTML/,
          /innerHTML\s*=/,
          /document\.write/,
          /eval\s*\(/
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(content)) {
            this.log('WARNING', 'Dangerous HTML Manipulation', 'FOUND', `Potentially dangerous HTML manipulation in ${file}`);
            foundDangerousHtml = true;
          }
        }
      }

      if (!foundDangerousHtml) {
        this.log('PASS', 'Dangerous HTML Manipulation', 'PASSED', 'No dangerous HTML manipulation found');
      }

    } catch (error) {
      this.log('WARNING', 'XSS Protection', 'ERROR', error.message);
    }
  }

  /**
   * 4. CORS設定テスト
   */
  async testCORSConfiguration() {
    console.log('\n🔍 CORS設定テスト');

    try {
      const backendFiles = simpleGlob('backend/**/*.{js,mjs}');
      let corsConfigFound = false;

      for (const file of backendFiles) {
        const content = readFileSync(file, 'utf8');
        
        if (content.includes('cors') && content.includes('origin')) {
          corsConfigFound = true;
          
          // 危険なCORS設定をチェック
          if (content.includes('origin: true') || content.includes('origin: "*"')) {
            this.log('CRITICAL', 'CORS Configuration', 'FAILED', 'Wildcard CORS origin allows all domains');
          } else if (content.includes('allowedOrigins') || content.includes('ORIGIN_ALLOWLIST')) {
            this.log('PASS', 'CORS Configuration', 'PASSED', 'CORS properly restricted to allowed origins');
          } else {
            this.log('WARNING', 'CORS Configuration', 'UNCLEAR', 'CORS configuration needs review');
          }

          // credentials設定確認
          if (content.includes('credentials: true')) {
            if (content.includes('origin: "*"')) {
              this.log('CRITICAL', 'CORS Credentials', 'FAILED', 'credentials: true with wildcard origin is dangerous');
            } else {
              this.log('PASS', 'CORS Credentials', 'PASSED', 'credentials properly configured with restricted origins');
            }
          }
        }
      }

      if (!corsConfigFound) {
        this.log('WARNING', 'CORS Configuration', 'MISSING', 'No CORS configuration found');
      }

    } catch (error) {
      this.log('WARNING', 'CORS Configuration', 'ERROR', error.message);
    }
  }

  /**
   * 5. ファイルアップロードセキュリティテスト
   */
  async testFileUploadSecurity() {
    console.log('\n🔍 ファイルアップロードセキュリティテスト');

    try {
      const backendFiles = simpleGlob('backend/**/*.{js,mjs}');
      let uploadConfigFound = false;

      for (const file of backendFiles) {
        const content = readFileSync(file, 'utf8');
        
        if (content.includes('multer')) {
          uploadConfigFound = true;

          // ファイルサイズ制限確認
          if (content.includes('fileSize:') || content.includes('limits:')) {
            this.log('PASS', 'File Size Limits', 'PASSED', 'File size limits configured');
          } else {
            this.log('CRITICAL', 'File Size Limits', 'MISSING', 'No file size limits found');
          }

          // ファイルタイプ制限確認
          if (content.includes('fileFilter') && content.includes('mimetype')) {
            this.log('PASS', 'File Type Filtering', 'PASSED', 'File type filtering implemented');
          } else {
            this.log('CRITICAL', 'File Type Filtering', 'MISSING', 'No file type filtering found');
          }

          // 危険なファイルタイプチェック
          if (content.includes('application/') && !content.includes('image/')) {
            this.log('WARNING', 'Dangerous File Types', 'ALLOWED', 'Non-image file types may be allowed');
          }
        }
      }

      if (!uploadConfigFound) {
        this.log('WARNING', 'File Upload Security', 'MISSING', 'No file upload configuration found');
      }

    } catch (error) {
      this.log('WARNING', 'File Upload Security', 'ERROR', error.message);
    }
  }

  /**
   * 6. レート制限テスト
   */
  async testRateLimiting() {
    console.log('\n🔍 レート制限テスト');

    try {
      const backendFiles = simpleGlob('backend/**/*.{js,mjs}');
      let rateLimitFound = false;

      for (const file of backendFiles) {
        const content = readFileSync(file, 'utf8');
        
        if (content.includes('rateLimit') || content.includes('express-rate-limit')) {
          rateLimitFound = true;

          // レート制限設定確認
          const windowMatches = content.match(/windowMs:\s*(\d+)/g);
          const maxMatches = content.match(/max:\s*(\d+)/g);

          if (windowMatches && maxMatches) {
            this.log('PASS', 'Rate Limiting', 'PASSED', `Rate limiting configured: ${windowMatches.length} limiters found`);
          } else {
            this.log('WARNING', 'Rate Limiting', 'INCOMPLETE', 'Rate limiting partially configured');
          }

          // 階層的制限確認
          if (content.includes('editLimiter') || content.includes('purchaseLimiter')) {
            this.log('PASS', 'Tiered Rate Limiting', 'PASSED', 'Multiple rate limit tiers implemented');
          }
        }
      }

      if (!rateLimitFound) {
        this.log('CRITICAL', 'Rate Limiting', 'MISSING', 'No rate limiting found');
      }

    } catch (error) {
      this.log('WARNING', 'Rate Limiting', 'ERROR', error.message);
    }
  }

  /**
   * 7. 依存関係脆弱性テスト
   */
  async testDependencyVulnerabilities() {
    console.log('\n🔍 依存関係脆弱性テスト');

    try {
      // npm auditを実行
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditResult);

      if (auditData.metadata) {
        const { vulnerabilities } = auditData.metadata;
        const criticalCount = vulnerabilities.critical || 0;
        const highCount = vulnerabilities.high || 0;
        const moderateCount = vulnerabilities.moderate || 0;

        if (criticalCount > 0) {
          this.log('CRITICAL', 'Dependency Vulnerabilities', 'FOUND', `${criticalCount} critical vulnerabilities`);
        } else if (highCount > 0) {
          this.log('WARNING', 'Dependency Vulnerabilities', 'FOUND', `${highCount} high-severity vulnerabilities`);
        } else if (moderateCount > 0) {
          this.log('WARNING', 'Dependency Vulnerabilities', 'FOUND', `${moderateCount} moderate vulnerabilities`);
        } else {
          this.log('PASS', 'Dependency Vulnerabilities', 'PASSED', 'No high-severity vulnerabilities found');
        }
      }

    } catch (error) {
      // npm audit may exit with non-zero code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          const criticalCount = auditData.metadata?.vulnerabilities?.critical || 0;
          const highCount = auditData.metadata?.vulnerabilities?.high || 0;
          
          if (criticalCount > 0 || highCount > 0) {
            this.log('CRITICAL', 'Dependency Vulnerabilities', 'FOUND', 
              `${criticalCount} critical, ${highCount} high-severity vulnerabilities`);
          }
        } catch {
          this.log('WARNING', 'Dependency Vulnerabilities', 'ERROR', 'Could not parse audit results');
        }
      } else {
        this.log('WARNING', 'Dependency Vulnerabilities', 'ERROR', error.message);
      }
    }
  }

  /**
   * 8. セキュリティヘッダーテスト
   */
  async testSecurityHeaders() {
    console.log('\n🔍 セキュリティヘッダーテスト');

    try {
      if (existsSync('vercel.json')) {
        const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf8'));
        const headers = vercelConfig.headers?.find(h => h.headers)?.headers || [];

        const requiredHeaders = [
          'X-Content-Type-Options',
          'X-Frame-Options', 
          'X-XSS-Protection',
          'Referrer-Policy',
          'Content-Security-Policy'
        ];

        let missingHeaders = [];
        for (const required of requiredHeaders) {
          const found = headers.find(h => h.key === required);
          if (found) {
            this.log('PASS', `Security Header: ${required}`, 'PASSED', `Value: ${found.value}`);
          } else {
            missingHeaders.push(required);
          }
        }

        if (missingHeaders.length > 0) {
          this.log('WARNING', 'Security Headers', 'INCOMPLETE', `Missing: ${missingHeaders.join(', ')}`);
        } else {
          this.log('PASS', 'Security Headers', 'PASSED', 'All required security headers configured');
        }
      }

    } catch (error) {
      this.log('WARNING', 'Security Headers', 'ERROR', error.message);
    }
  }

  /**
   * 全テスト実行
   */
  async runAllTests() {
    console.log('🔒 JIZAI セキュリティテストスイート開始\n');
    console.log('=' .repeat(60));

    await this.testApiKeyExposure();
    await this.testInputValidation();
    await this.testXSSProtection();
    await this.testCORSConfiguration();
    await this.testFileUploadSecurity();
    await this.testRateLimiting();
    await this.testDependencyVulnerabilities();
    await this.testSecurityHeaders();

    this.printSummary();
  }

  /**
   * 結果サマリー出力
   */
  printSummary() {
    console.log('\n' + '=' .repeat(60));
    console.log('🔒 セキュリティテスト結果サマリー');
    console.log('=' .repeat(60));

    const passedTests = this.results.filter(r => r.level === 'PASS').length;
    const totalTests = this.results.length;

    console.log(`✅ 通過: ${passedTests}/${totalTests}`);
    console.log(`⚠️  警告: ${this.warnings.length}`);
    console.log(`🚨 重大な問題: ${this.criticalIssues.length}`);

    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 重大な問題:');
      this.criticalIssues.forEach(issue => {
        console.log(`   - ${issue.test}: ${issue.details}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      this.warnings.forEach(warning => {
        console.log(`   - ${warning.test}: ${warning.details}`);
      });
    }

    console.log('\n' + '=' .repeat(60));

    if (this.criticalIssues.length === 0) {
      console.log('🎉 重大なセキュリティ問題は見つかりませんでした！');
      console.log('🚀 本番デプロイの準備ができています。');
    } else {
      console.log('⚠️  本番デプロイ前に重大な問題を修正してください。');
    }
  }
}

// メイン実行
const tester = new SecurityTester();
tester.runAllTests().catch(console.error);