#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Security Configuration Validation"
echo "===================================="

# Check environment variables
check_env_var() {
    local var_name="$1"
    local min_length="${2:-1}"
    local var_value=""
    
    eval "var_value=\${${var_name}:-}"
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name not set"
        return 1
    elif [ ${#var_value} -lt $min_length ]; then
        echo "❌ $var_name too short (${#var_value} chars, need $min_length+)"
        return 1
    else
        echo "✅ $var_name configured (${#var_value} chars)"
    fi
}

# Check critical security keys
echo "🔐 Checking Security Keys:"
check_env_var "JWT_SECRET" 64 || echo "  Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
check_env_var "API_ENCRYPTION_KEY" 32 || echo "  Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""

# Check Supabase configuration
echo -e "\n🗄️ Checking Database Configuration:"
check_env_var "SUPABASE_URL" 20
check_env_var "SUPABASE_ANON_KEY" 100
check_env_var "SUPABASE_SERVICE_KEY" 100

# Check production-specific settings
echo -e "\n🚀 Checking Production Settings:"
if [ "${NODE_ENV:-}" = "production" ]; then
    echo "✅ NODE_ENV=production"
    
    if [[ "${ALLOWED_ORIGINS:-}" =~ https:// ]]; then
        echo "✅ CORS origins use HTTPS"
    else
        echo "❌ CORS origins should use HTTPS in production"
    fi
    
    eval "admin_token=\${ADMIN_TOKEN:-}"
    if [ -n "$admin_token" ] && [ ${#admin_token} -ge 32 ]; then
        echo "✅ Admin token configured (${#admin_token} chars)"
    else
        echo "❌ Admin token missing or too short"
    fi
else
    echo "ℹ️ Development environment detected"
fi

# Check for placeholder values
echo -e "\n🚨 Checking for Placeholder Values:"
env_file="${1:-.env}"
if [ -f "$env_file" ]; then
    if grep -q "your_.*_here\|replace.*with.*real\|changeme\|fixme" "$env_file"; then
        echo "❌ Found placeholder values in $env_file:"
        grep -n "your_.*_here\|replace.*with.*real\|changeme\|fixme" "$env_file" || true
    else
        echo "✅ No placeholder values found"
    fi
else
    echo "⚠️ Environment file $env_file not found"
fi

echo -e "\n🏁 Validation Complete"