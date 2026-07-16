# Codex 作業ガイド

このファイルは、別PCや新しいCodexセッションで作業を再開するためのリポジトリ共通指示です。

## 最初に読むもの

1. `README.md` — プロダクト概要と通常の起動方法
2. `docs/DEVELOPMENT.md` — 環境構築、検証、Git運用、トラブル対応
3. `docs/ARCHITECTURE.md` — 現在の設計、データ契約、未実装事項

## 作業開始時の確認

```bash
git status --short
git branch --show-current
git pull --ff-only
npm ci
npm run typecheck
```

- ユーザーの未コミット変更を消さないこと。
- 変更前に関連ファイルと `git diff` を確認すること。
- Expo SDKとReact Nativeのバージョンは独立に変更しないこと。更新時は `npx expo install --fix` と `npx expo-doctor` を実行すること。
- 生成物の `dist/`、端末固有情報の `.expo/`、依存関係の `node_modules/` はコミットしないこと。
- 棋譜・評価値の契約を変更する場合は `docs/ARCHITECTURE.md` と入力例も同時に更新すること。

## 完了条件

通常のコード変更では、最低限次を通します。

```bash
npm run typecheck
EXPO_NO_TELEMETRY=1 npx expo-doctor
git diff --check
```

画面や依存関係を変更した場合は、可能ならAndroidバンドルも確認します。

```bash
EXPO_NO_TELEMETRY=1 npx expo export --platform android --output-dir dist
```

## 現在の優先課題

最優先は、生のKIF/CSA棋譜をUSIエンジンで解析して `scripts/build_quizzes.py` の入力JSONLを自動生成するパイプラインです。現時点のアプリは解析済みJSONLからのクイズ生成まで対応しています。
