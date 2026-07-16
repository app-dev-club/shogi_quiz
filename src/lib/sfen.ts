export type BoardCell = { piece: string; promoted: boolean; white: boolean } | null;

const PIECES: Record<string, string> = {
  K: '玉', R: '飛', B: '角', G: '金', S: '銀', N: '桂', L: '香', P: '歩'
};

export function parseSfen(sfen: string): BoardCell[][] {
  const boardPart = sfen.split(' ')[0];
  if (!boardPart) throw new Error('Invalid SFEN');

  return boardPart.split('/').map((rank) => {
    const cells: BoardCell[] = [];
    let promoted = false;
    for (const char of rank) {
      if (/\d/.test(char)) {
        cells.push(...Array(Number(char)).fill(null));
      } else if (char === '+') {
        promoted = true;
      } else {
        const white = char === char.toLowerCase();
        const key = char.toUpperCase();
        const base = PIECES[key] ?? key;
        cells.push({ piece: promoted ? promotedName(base) : base, promoted, white });
        promoted = false;
      }
    }
    return cells;
  });
}

function promotedName(piece: string): string {
  return ({ 飛: '龍', 角: '馬', 銀: '全', 桂: '圭', 香: '杏', 歩: 'と' } as Record<string, string>)[piece] ?? piece;
}
