#!/usr/bin/env python3
"""Analyze KIF/CSA games with a USI engine and emit quiz-candidate JSONL."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, TextIO


MATE_SCORE = 100_000


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="KIF/CSA棋譜をUSIエンジンで解析し、build_quizzes.py用JSONLを生成します。"
    )
    parser.add_argument("inputs", nargs="+", type=Path, help="KIFまたはCSA棋譜")
    parser.add_argument("--engine", required=True, type=Path, help="USIエンジン実行ファイル")
    parser.add_argument("--output", required=True, type=Path, help="出力JSONL")
    limit = parser.add_mutually_exclusive_group()
    limit.add_argument("--nodes", type=int, default=100_000, help="1局面の探索ノード数")
    limit.add_argument("--movetime", type=int, help="1局面の探索時間（ミリ秒）")
    parser.add_argument("--engine-option", action="append", default=[], metavar="NAME=VALUE")
    parser.add_argument("--source", help="1ファイル入力時の出典名（省略時はファイル名）")
    parser.add_argument("--start-move", type=int, default=1)
    parser.add_argument("--end-move", type=int)
    return parser.parse_args()


@dataclass(frozen=True)
class Analysis:
    score: int
    bestmove: str


class UsiEngine:
    def __init__(self, executable: Path, options: dict[str, str]) -> None:
        self.process = subprocess.Popen(
            [str(executable)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=None,
            text=True,
            encoding="utf-8",
            bufsize=1,
        )
        if self.process.stdin is None or self.process.stdout is None:
            raise RuntimeError("USIエンジンの標準入出力を開けませんでした。")
        self.stdin: TextIO = self.process.stdin
        self.stdout: TextIO = self.process.stdout
        self._send("usi")
        self._wait_for("usiok")
        for name, value in options.items():
            self._send(f"setoption name {name} value {value}")
        self._send("isready")
        self._wait_for("readyok")
        self._send("usinewgame")

    def _send(self, command: str) -> None:
        self.stdin.write(command + "\n")
        self.stdin.flush()

    def _readline(self) -> str:
        line = self.stdout.readline()
        if line == "":
            code = self.process.poll()
            raise RuntimeError(f"USIエンジンが応答を終了しました（終了コード: {code}）。")
        return line.strip()

    def _wait_for(self, expected: str) -> None:
        while self._readline() != expected:
            pass

    def analyze(self, sfen: str, nodes: int | None, movetime: int | None) -> Analysis:
        self._send(f"position sfen {sfen}")
        self._send(f"go movetime {movetime}" if movetime is not None else f"go nodes {nodes}")
        latest_score: int | None = None
        latest_pv_move: str | None = None
        while True:
            line = self._readline()
            fields = line.split()
            if fields[:1] == ["info"]:
                parsed = parse_info(fields)
                if parsed is not None:
                    latest_score, latest_pv_move = parsed
            if fields[:1] == ["bestmove"]:
                bestmove = fields[1] if len(fields) > 1 else latest_pv_move
                if latest_score is None or not bestmove or bestmove in {"none", "resign", "win"}:
                    raise RuntimeError(f"局面の評価値または最善手を取得できませんでした: {sfen}")
                return Analysis(latest_score, bestmove)

    def close(self) -> None:
        if self.process.poll() is None:
            try:
                self._send("quit")
                self.process.wait(timeout=5)
            except (BrokenPipeError, subprocess.TimeoutExpired):
                self.process.terminate()
        self.stdin.close()
        self.stdout.close()

    def __enter__(self) -> "UsiEngine":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()


def parse_info(fields: list[str]) -> tuple[int, str | None] | None:
    if "multipv" in fields:
        try:
            if fields[fields.index("multipv") + 1] != "1":
                return None
        except IndexError:
            return None
    try:
        score_index = fields.index("score")
        score_type = fields[score_index + 1]
        raw_score_text = fields[score_index + 2]
    except (ValueError, IndexError):
        return None
    if score_type == "cp":
        try:
            score = int(raw_score_text)
        except ValueError:
            return None
    elif score_type == "mate":
        score = -MATE_SCORE if raw_score_text.startswith("-") else MATE_SCORE
    else:
        return None
    pv_move = None
    if "pv" in fields:
        pv_index = fields.index("pv")
        if pv_index + 1 < len(fields):
            pv_move = fields[pv_index + 1]
    return score, pv_move


def parse_options(values: Iterable[str]) -> dict[str, str]:
    options: dict[str, str] = {}
    for value in values:
        if "=" not in value:
            raise ValueError(f"engine-optionはNAME=VALUE形式で指定してください: {value}")
        name, option_value = value.split("=", 1)
        if not name:
            raise ValueError("engine-optionの名前が空です。")
        options[name] = option_value
    return options


def load_game(path: Path) -> dict[str, Any]:
    try:
        import shogi.CSA
        import shogi.KIF
    except ImportError as exc:
        raise RuntimeError(
            "棋譜解析依存がありません。python3 -m pip install -r requirements-analysis.txt を実行してください。"
        ) from exc

    suffix = path.suffix.lower()
    parser = shogi.KIF.Parser if suffix in {".kif", ".kifu"} else shogi.CSA.Parser if suffix == ".csa" else None
    if parser is None:
        raise ValueError(f"未対応の棋譜形式です: {path}（.kif/.kifu/.csaに対応）")
    games = parser.parse_file(str(path))
    if not games or len(games) != 1:
        raise ValueError(f"1ファイルには1対局を指定してください: {path}")
    return games[0]


def game_rows(
    path: Path,
    game: dict[str, Any],
    engine: UsiEngine,
    nodes: int | None,
    movetime: int | None,
    source: str,
    start_move: int,
    end_move: int | None,
) -> Iterable[dict[str, Any]]:
    import shogi
    import shogi.KIF

    board = shogi.Board(game.get("sfen") or shogi.STARTING_SFEN)
    moves = game.get("moves", [])
    for index, played_move in enumerate(moves, 1):
        if end_move is not None and index > end_move:
            break
        before_sfen = board.sfen()
        side = "black" if board.turn == shogi.BLACK else "white"
        if index < start_move:
            board.push_usi(played_move)
            continue

        before = engine.analyze(before_sfen, nodes, movetime)
        played_notation = shogi.KIF.Exporter.kif_move_from(played_move, board)
        best_notation = shogi.KIF.Exporter.kif_move_from(before.bestmove, board)
        board.push_usi(played_move)
        after = engine.analyze(board.sfen(), nodes, movetime)
        # USIのscoreは手番側視点。着手後は手番が逆なので符号を反転する。
        evaluation_after = -after.score
        yield {
            "game_id": path.stem,
            "source": source,
            "move_number": index,
            "side_to_move": side,
            "sfen": before_sfen,
            "evaluation_before": before.score,
            "evaluation_after": evaluation_after,
            "played_move": played_move,
            "played_notation": played_notation,
            "best_move": before.bestmove,
            "best_notation": best_notation,
        }


def main() -> None:
    args = parse_args()
    if args.start_move < 1 or (args.end_move is not None and args.end_move < args.start_move):
        raise SystemExit("手数範囲が不正です。")
    if args.source and len(args.inputs) != 1:
        raise SystemExit("--sourceは入力が1ファイルのときだけ指定できます。")
    options = parse_options(args.engine_option)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    row_count = 0
    with UsiEngine(args.engine, options) as engine, args.output.open("w", encoding="utf-8") as output:
        for path in args.inputs:
            game = load_game(path)
            source = args.source or path.name
            for row in game_rows(
                path, game, engine, args.nodes, args.movetime, source, args.start_move, args.end_move
            ):
                output.write(json.dumps(row, ensure_ascii=False) + "\n")
                output.flush()
                row_count += 1
                deterioration = row["evaluation_before"] - row["evaluation_after"]
                print(f"{path.name} {row['move_number']}手目: 悪化幅 {deterioration:+d} cp", file=sys.stderr)
    print(f"{row_count}局面を {args.output} に出力しました。")


if __name__ == "__main__":
    main()
