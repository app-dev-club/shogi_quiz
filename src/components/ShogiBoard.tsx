import { StyleSheet, Text, View } from 'react-native';
import { parseSfen } from '../lib/sfen';

type Props = { sfen: string; reversed?: boolean };

export function ShogiBoard({ sfen, reversed = false }: Props) {
  const parsed = parseSfen(sfen);
  const board = reversed
    ? [...parsed].reverse().map((rank) => [...rank].reverse())
    : parsed;

  return (
    <View style={styles.frame} accessibilityLabel="将棋盤">
      {board.map((rank, y) => (
        <View key={y} style={styles.rank}>
          {rank.map((cell, x) => (
            <View key={`${y}-${x}`} style={styles.cell}>
              {cell ? (
                <Text
                  style={[
                    styles.piece,
                    cell.white && styles.whitePiece,
                    cell.promoted && styles.promoted
                  ]}
                >
                  {cell.piece}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#3D2C21',
    backgroundColor: '#E8B96D'
  },
  rank: { flex: 1, flexDirection: 'row' },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#6E4D2C'
  },
  piece: {
    color: '#241B15',
    fontSize: 20,
    fontWeight: '700'
  },
  whitePiece: { transform: [{ rotate: '180deg' }] },
  promoted: { color: '#A12E24' }
});
