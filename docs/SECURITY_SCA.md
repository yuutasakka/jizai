# SCA（依存関係の脆弱性管理）運用ガイド

本書は、依存パッケージの脆弱性検出・更新運用（SCA）の標準手順です。

## 仕組み
- Dependabot: 週次で`npm`/`GitHub Actions`の更新PRを作成（`.github/dependabot.yml`）。
- GitHub Actions: 週次の`npm audit`実行（rootとbackend）（`.github/workflows/security-audit.yml`）。
- ローカルスクリプト: `node scripts/sca-audit.mjs` で同等のチェックを実行可能。

## 運用フロー
1. 週次ワークフロー（または手動）で`npm audit --audit-level=high`を実行。
2. High/Critical の脆弱性がある場合は最優先で解消（依存更新 or 迂回策）。
3. Dependabot のPRをレビューし、SemVerとBREAKING CHANGEに注意して段階的にマージ。
4. 変更は必ずステージングでE2E・回帰確認後に本番へ。

## ポリシー
- 重大度: High以上はSLO 7日以内の解消目標。Moderateは月次レビューで対応。
- 例外: やむを得ず残す場合はリスク評価・チケット化・期限設定を必須。

## 実行例
```bash
# 手動でのローカル実行
node scripts/sca-audit.mjs

# あるいは root / backend 個別に
cd backend && npm audit --audit-level=high
```

