# 開発・引き継ぎガイド

## リポジトリ

- GitHub: `git@github.com:app-dev-club/shogi_quiz.git`
- 基準ブランチ: `main`
- アプリ: Expo / React Native / TypeScript
- 対象: iOS、Android

## 別PCでの初回セットアップ

### 1. 必要なもの

- Git
- Node.js 20以上
- npm
- 実機確認をする場合はExpo Go
- iOS Simulatorを使う場合はXcode
- Android Emulatorを使う場合はAndroid Studio

### 2. クローンと依存関係の導入

```bash
git clone git@github.com:app-dev-club/shogi_quiz.git
cd shogi_quiz
npm ci
```

SSH鍵をGitHubに登録していないPCでは、GitHub側の案内に従って鍵を登録するかHTTPS URLを利用します。

### 3. 状態確認

```bash
npm run typecheck
EXPO_NO_TELEMETRY=1 npx expo-doctor
```

Expo Doctorがすべて成功すれば、主要な依存関係は整っています。

### 4. 実機で起動

```bash
npx expo start -c
```

PCとスマートフォンを同じネットワークに接続し、表示されたQRコードをExpo Goで読み取ります。`-c` はMetroのキャッシュを消して起動する指定です。

現在のプロジェクトはExpo SDK 54です。Expo Goとの互換性エラーが出た場合は、まず `package.json` のExpo SDKと端末のExpo Goが対応しているか確認してください。SDKを更新する前に、同じブランチを使う他のPCへの影響も確認します。

### 5. Simulator / Emulator

```bash
npm run ios
npm run android
```

## 日常の開発フロー

作業開始時:

```bash
git status --short
git pull --ff-only
npm ci
```

機能ごとにブランチを作る場合:

```bash
git switch -c codex/feature-name
```

作業後:

```bash
npm run typecheck
EXPO_NO_TELEMETRY=1 npx expo-doctor
git diff --check
git status --short
```

別PCへ移る前に、必要な変更をコミットしてGitHubへpushします。未コミットの変更は別PCから取得できません。

```bash
git add <確認したファイル>
git commit -m "変更内容を表すメッセージ"
git push -u origin <ブランチ名>
```

## よく使うコマンド

| コマンド | 用途 |
| --- | --- |
| `npm ci` | lockfileどおりに依存関係を再現 |
| `npm run start` | Expo開発サーバー起動 |
| `npx expo start -c` | キャッシュを消して起動 |
| `npm run ios` | iOS Simulatorで起動 |
| `npm run android` | Android Emulatorで起動 |
| `npm run typecheck` | TypeScript検査 |
| `npx expo-doctor` | Expo依存関係と設定の診断 |
| `python3 scripts/build_quizzes.py ...` | 解析済み局面から問題を生成 |
| `python3 scripts/analyze_games.py ...` | KIF/CSAをUSIエンジンで解析 |

## トラブルシューティング

### Project is incompatible with this version of Expo Go

Expo GoとプロジェクトのSDKが一致していません。現在のプロジェクトはSDK 54です。別PCで勝手にSDKを上げず、チームで対象SDKを決めてから段階的に更新します。

### 依存関係がおかしい

まずlockfileから入れ直します。

```bash
npm ci
npx expo-doctor
```

SDK更新を行った場合のみ、次の手順で互換バージョンへ揃えます。

```bash
npm install expo@^54.0.0
npx expo install --fix
npx expo-doctor
```

### QRコードから接続できない

- PCと端末が同じWi-Fiか確認する。
- VPNを一時的に切って確認する。
- Expo起動画面でTunnel接続を試す。
- `npx expo start -c` でキャッシュを消す。

### Pythonのキャッシュ書き込みで失敗する

macOS標準Pythonがホーム側へキャッシュを書けない環境では、検証時だけ一時領域を指定します。

```bash
PYTHONPYCACHEPREFIX=/tmp/shogi-pycache python3 -m py_compile scripts/build_quizzes.py
```

## 秘密情報とデータ

- APIキー、GitHubトークン、エンジン固有の秘密情報はコミットしない。
- 将来環境変数を追加する場合は `.env.example` だけをコミットし、実値を含む `.env` はignoreする。
- 公開棋譜でも利用規約と転載可否を確認する。
- 対局者名などの個人情報を扱う場合は、アプリ公開範囲に応じて匿名化を検討する。
