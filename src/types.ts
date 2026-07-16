export type Side = 'black' | 'white';

export type MoveChoice = {
  id: 'played' | 'best';
  notation: string;
  usi: string;
};

export type Quiz = {
  id: string;
  title: string;
  source: string;
  moveNumber: number;
  sideToMove: Side;
  sfen: string;
  evaluationBefore: number;
  evaluationAfter: number;
  choices: [MoveChoice, MoveChoice];
  bestMoveId: 'best';
  explanation: string;
};
