import { Quiz } from '../types';

export const quizzes: Quiz[] = [
  {
    id: 'sample-1',
    title: '終盤の踏み込み',
    source: 'サンプル棋譜・第1局',
    moveNumber: 93,
    sideToMove: 'black',
    sfen: '4k4/9/3g1g3/2p1p1p2/3p1p3/2P1P1P2/3G1G3/4R4/4K4 b S2P 93',
    evaluationBefore: 420,
    evaluationAfter: -680,
    choices: [
      { id: 'played', notation: '▲5二飛成', usi: '5b5a+' },
      { id: 'best', notation: '▲5三銀', usi: 'S*5c' }
    ],
    bestMoveId: 'best',
    explanation: 'すぐに飛車を成ると受けに回られて攻めが切れます。5三銀なら玉の逃げ道を狭めながら金に当たり、攻めが続きます。'
  },
  {
    id: 'sample-2',
    title: '攻めるか、受けるか',
    source: 'サンプル棋譜・第2局',
    moveNumber: 68,
    sideToMove: 'white',
    sfen: '3gkg3/9/2p1p1p2/3p1p3/2P3P2/3P1P3/2G1P1G2/4R4/4K4 w B2P 68',
    evaluationBefore: -180,
    evaluationAfter: 910,
    choices: [
      { id: 'best', notation: '△4二金', usi: '4a4b' },
      { id: 'played', notation: '△7六歩', usi: '7c7d' }
    ],
    bestMoveId: 'best',
    explanation: '7六歩は手番を渡すため、飛車の侵入を許します。4二金と先に受ければ陣形が締まり、互角の勝負を保てます。'
  },
  {
    id: 'sample-3',
    title: '一手だけの受け',
    source: 'サンプル棋譜・第3局',
    moveNumber: 111,
    sideToMove: 'black',
    sfen: '5k3/4g4/3p1p3/4p4/9/3P1P3/4G4/3R5/5K3 b GSN 111',
    evaluationBefore: 760,
    evaluationAfter: -240,
    choices: [
      { id: 'played', notation: '▲3二竜', usi: '4h3h' },
      { id: 'best', notation: '▲5八金打', usi: 'G*5h' }
    ],
    bestMoveId: 'best',
    explanation: '攻め合いは自玉への詰めろが残ります。5八金打で詰めろを外すのが唯一の受けで、その後の反撃が間に合います。'
  }
];
