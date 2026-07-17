# 勝負手クイズ

棋譜の中から形勢を大きく損ねた局面を抽出し、「実戦手」と「最善手」の二択で振り返るモバイルアプリです。Expo / React Native 製で、iOS と Android の両方を対象にしています。

別PCや新しいCodexセッションで開発を再開する場合は、[開発・引き継ぎガイド](docs/DEVELOPMENT.md)を参照してください。設計と未実装事項は[設計ドキュメント](docs/ARCHITECTURE.md)、Codex向けの共通作業指示は[AGENTS.md](AGENTS.md)にまとめています。

## 現在のMVP

- SFENから9×9の将棋盤を表示
- 手番に合わせて盤面を反転
- 実戦手と最善手を二択表示（A/Bの位置は問題ごとに変更可能）
- 回答直後に正解と解説を表示
- 全問終了後にスコアを表示
- エンジン解析済みJSONLから、悪化幅が一定以上の局面を抽出

## 起動

Node.js 20 以降を推奨します。

```bash
npm install
npm run start
```

表示されたQRコードを Expo Go で読むか、`i`（iOS Simulator）または `a`（Android Emulator）を押してください。

## 棋譜データをクイズにする

KIF/CSA棋譜と、やねうら王などのUSIエンジンを用意します。Python側の依存関係を導入し、棋譜を解析してからクイズデータを生成します。

```bash
python3 -m pip install -r requirements-analysis.txt
python3 scripts/analyze_games.py game.kif \
  --engine /path/to/YaneuraOu-by-gcc \
  --output analyzed.jsonl \
  --nodes 100000 \
  --engine-option Threads=4 \
  --engine-option USI_Hash=256
python3 scripts/build_quizzes.py analyzed.jsonl --threshold 500 --limit 100
npm run typecheck
```

`--nodes` の代わりに `--movetime 1000`（ミリ秒）も指定できます。解析の再現性を重視する場合は、同じエンジン・評価関数・ノード数・オプションを使ってください。長い棋譜の試運転には `--start-move` と `--end-move` が使えます。

解析スクリプトは各着手の前後を評価し、`evaluation_before` と `evaluation_after` をどちらも「実戦手を指した側がプラス」になるよう正規化します。出力は1局面1行のJSONLです。

必要なフィールドは次のとおりです。

| フィールド | 内容 |
| --- | --- |
| `game_id` | 対局を識別するID |
| `source` | 棋譜名・大会名など |
| `move_number` | 手数 |
| `side_to_move` | `black` または `white` |
| `sfen` | 着手前局面 |
| `evaluation_before` | 実戦手を指す前の、指し手側視点の最善評価値（cp） |
| `evaluation_after` | 実戦手を指した後の、同じ指し手側視点の評価値（cp） |
| `played_move` / `best_move` | USI形式の実戦手 / 最善手 |
| `played_notation` / `best_notation` | 画面表示用の日本語表記 |

[入力例](examples/analyzed_positions.jsonl)から、500cp以上悪化した局面を最大100問生成する例です。

```bash
python3 scripts/build_quizzes.py examples/analyzed_positions.jsonl --threshold 500 --limit 100
npm run typecheck
```

生成先は `src/data/quizzes.ts` です。MVPでは端末内に同梱しますが、問題数が増えたらAPIまたはSQLite配信へ移行できます。

## 推奨する解析ルール

単純な一回の浅い評価はノイズが多いため、次の条件が現実的です。

1. 各局面を同じ探索条件（例: 1手あたり1秒、または一定ノード数）で解析する。
2. 実戦手を指す前の最善評価と、実戦手を指した後の評価の差が500cp以上なら候補にする。
3. 詰みが発生・消滅した局面は評価値とは別の最優先カテゴリにする。
4. 実戦手と最善手が同一、合法手が極端に少ない、直前問題と近すぎる局面は除外する。
5. エンジンの読み筋（PV）を保存し、解説生成や再検証に利用する。

## ディレクトリ

```text
App.tsx                    クイズ進行と画面
src/components/ShogiBoard  SFEN盤面表示
src/data/quizzes.ts        アプリに同梱する問題
scripts/build_quizzes.py   解析結果から問題を抽出
```

公開棋譜を利用する場合も、配布元の利用規約と棋譜の転載可否を確認してください。
