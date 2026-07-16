#!/usr/bin/env python3
"""Convert engine-analyzed positions (JSONL) into the app's TypeScript quiz data."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="1局面1行のJSONLファイル")
    parser.add_argument("--output", type=Path, default=Path("src/data/quizzes.ts"))
    parser.add_argument("--threshold", type=int, default=500, help="採用する評価値悪化幅（cp）")
    parser.add_argument("--limit", type=int, default=100)
    return parser.parse_args()


def load_candidates(path: Path, threshold: int) -> list[dict[str, Any]]:
    quizzes: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as source:
        for line_number, raw_line in enumerate(source, 1):
            if not raw_line.strip():
                continue
            row = json.loads(raw_line)
            required = {
                "game_id", "source", "move_number", "side_to_move", "sfen",
                "evaluation_before", "evaluation_after", "played_move",
                "played_notation", "best_move", "best_notation"
            }
            missing = sorted(required - row.keys())
            if missing:
                raise ValueError(f"{line_number}行目: 必須項目がありません: {', '.join(missing)}")

            if row["played_move"] == row["best_move"]:
                continue

            # before/after とも「実戦手を指した側」から見た値に正規化済み、という入力契約。
            deterioration = int(row["evaluation_before"]) - int(row["evaluation_after"])
            if deterioration < threshold:
                continue

            quizzes.append({
                "id": f'{row["game_id"]}-{row["move_number"]}',
                "title": row.get("title", "勝負の分かれ目"),
                "source": row["source"],
                "moveNumber": int(row["move_number"]),
                "sideToMove": row["side_to_move"],
                "sfen": row["sfen"],
                "evaluationBefore": int(row["evaluation_before"]),
                "evaluationAfter": int(row["evaluation_after"]),
                "choices": [
                    {"id": "played", "notation": row["played_notation"], "usi": row["played_move"]},
                    {"id": "best", "notation": row["best_notation"], "usi": row["best_move"]},
                ],
                "bestMoveId": "best",
                "explanation": row.get(
                    "explanation",
                    f'実戦手では評価値が {deterioration} 点悪化。最善手なら形勢を維持できました。'
                ),
            })
    return quizzes


def write_typescript(path: Path, quizzes: list[dict[str, Any]]) -> None:
    serialized = json.dumps(quizzes, ensure_ascii=False, indent=2)
    content = (
        "// scripts/build_quizzes.py で自動生成されました。\n"
        "import { Quiz } from '../types';\n\n"
        f"export const quizzes: Quiz[] = {serialized};\n"
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> None:
    args = parse_args()
    quizzes = load_candidates(args.input, args.threshold)[: args.limit]
    if not quizzes:
        raise SystemExit("条件に合う局面がありません。thresholdまたは入力データを確認してください。")
    write_typescript(args.output, quizzes)
    print(f"{len(quizzes)}問を {args.output} に出力しました。")


if __name__ == "__main__":
    main()
