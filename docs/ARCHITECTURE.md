# 設計と現在地

## プロダクトの目的

将棋の棋譜から形勢を大きく悪化させた局面を取り出し、実戦手とエンジン最善手の二択クイズとして振り返れるモバイルアプリを作ります。

## 現在の状態

2026-07-16時点のMVPでは、次が動作します。

- Expo SDK 54でiOS / Androidを対象に起動
- SFENから9×9の盤面を描画
- 後手番では盤面を反転
- 実戦手と最善手を二択表示
- 回答判定、解説、進捗、最終スコアを表示
- エンジン解析済みJSONLから、指定した評価値悪化幅以上の問題を生成

実装済みの解析パイプライン:

- `scripts/analyze_games.py` によるKIF / CSAファイルの読み込み
- USIエンジンを使った着手前後の自動解析と視点の正規化

未実装:

- エンジンPVからの自動解説生成
- 問題のAPI配信、端末保存、学習履歴
- ユーザー認証、同期、問題のお気に入り
- 駒台、直前手や候補手の盤面上ハイライト

## 処理の境界

```text
KIF / CSA棋譜
    ↓ scripts/analyze_games.py + USIエンジン
解析済み局面 JSONL
    ↓ scripts/build_quizzes.py
src/data/quizzes.ts
    ↓ Expoアプリ
盤面 → 二択回答 → 解説 → スコア
```

棋譜解析とモバイル表示を分離しているため、重いエンジン処理をスマートフォン上で行う必要はありません。解析処理はローカルPCまたは将来のバックエンドで実行し、アプリには軽量な問題データだけを渡します。

## 主なファイル

| ファイル | 役割 |
| --- | --- |
| `App.tsx` | 問題進行、回答状態、採点、主要画面 |
| `src/components/ShogiBoard.tsx` | SFENから得た盤面の表示 |
| `src/lib/sfen.ts` | SFEN盤面部分のパース |
| `src/types.ts` | Quiz、MoveChoiceなどの型 |
| `src/data/quizzes.ts` | アプリへ同梱する問題データ |
| `scripts/build_quizzes.py` | JSONLの絞り込みとTypeScript生成 |
| `scripts/analyze_games.py` | KIF/CSAをUSIエンジンで解析してJSONLを生成 |
| `examples/analyzed_positions.jsonl` | 解析済み入力の最小例 |

## クイズデータ契約

アプリ内の `Quiz` は以下を持ちます。

- 局面ID、タイトル、出典、手数
- 手番と着手前SFEN
- 実戦手前後の評価値
- 実戦手と最善手の2候補
- 正解IDと解説

解析入力の重要な規則:

1. `evaluation_before` と `evaluation_after` は、両方とも実戦手を指した側の視点に正規化する。
2. プラスは実戦手を指した側が良い、マイナスは悪い。
3. 悪化幅は `evaluation_before - evaluation_after` で計算する。
4. 実戦手と最善手が同じ局面は問題にしない。
5. `played_move` と `best_move` はUSI形式、表示用表記は別フィールドにする。

入力全項目は `README.md` と `examples/analyzed_positions.jsonl` を参照してください。

## 採用している技術判断

- Expo: iOS / Androidを一つのTypeScriptコードで素早く検証するため。
- SFEN: 盤面をコンパクトかつ一般的な形式で受け渡すため。
- 解析済みJSONL: 大量データを行単位でストリーム処理しやすくするため。
- 問題の端末同梱: MVPでバックエンドなしに実機確認するため。

問題が増えたら、`src/data/quizzes.ts` の同梱からSQLiteまたはAPI配信への移行を検討します。

## 次に実装する推奨順序

1. 小さな棋譜セットと実エンジンで評価値、手数、合法手を統合テストする。
2. エンジンPVを保存し、自動解説生成へ利用する。
3. 問題画面に駒台と候補手ハイライトを追加する。

## 更新時の注意

- Expo SDK 54と対応依存関係はセットで管理する。
- エンジン評価値の視点を曖昧にしない。手番が入れ替わるため、符号反転漏れはクイズ抽出結果を壊す。
- `scripts/build_quizzes.py` は既定で `src/data/quizzes.ts` を上書きする。実データ生成前に差分やバックアップ方針を確認する。
- 棋譜の著作権・配布元規約を確認してからデータを同梱または配信する。
