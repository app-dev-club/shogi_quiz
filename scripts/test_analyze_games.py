import unittest

from analyze_games import MATE_SCORE, parse_info, parse_options


class AnalyzeGamesTest(unittest.TestCase):
    def test_parse_cp_info(self) -> None:
        self.assertEqual(parse_info("info depth 12 score cp -345 pv 7g7f 3c3d".split()), (-345, "7g7f"))

    def test_parse_mate_info(self) -> None:
        self.assertEqual(parse_info("info score mate 5 pv 2b3c+".split()), (MATE_SCORE, "2b3c+"))
        self.assertEqual(parse_info("info score mate + pv 2b3c+".split()), (MATE_SCORE, "2b3c+"))
        self.assertEqual(parse_info("info score mate -3 pv 8h2b+".split()), (-MATE_SCORE, "8h2b+"))

    def test_ignore_secondary_multipv(self) -> None:
        self.assertIsNone(parse_info("info multipv 2 score cp 120 pv 2g2f".split()))

    def test_parse_options(self) -> None:
        self.assertEqual(parse_options(["Threads=4", "USI_Hash=256"]), {"Threads": "4", "USI_Hash": "256"})

    def test_invalid_option(self) -> None:
        with self.assertRaises(ValueError):
            parse_options(["Threads"])


if __name__ == "__main__":
    unittest.main()
