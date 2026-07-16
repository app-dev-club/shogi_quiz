import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ShogiBoard } from './src/components/ShogiBoard';
import { quizzes } from './src/data/quizzes';
import { MoveChoice } from './src/types';

type Answer = { quizId: string; correct: boolean };

export default function App() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<MoveChoice | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const quiz = quizzes[index];
  const score = useMemo(() => answers.filter((answer) => answer.correct).length, [answers]);

  if (!quiz) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.result}>
          <Text style={styles.eyebrow}>RESULT</Text>
          <Text style={styles.resultTitle}>本日の勝負勘</Text>
          <Text style={styles.resultScore}>{score} / {quizzes.length}</Text>
          <Text style={styles.resultCopy}>
            大きく評価を落とした局面を、もう一度見直して棋力につなげましょう。
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => { setIndex(0); setSelected(null); setAnswers([]); }}
          >
            <Text style={styles.primaryButtonText}>もう一度挑戦</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const answer = (choice: MoveChoice) => {
    if (selected) return;
    setSelected(choice);
    setAnswers((current) => [
      ...current,
      { quizId: quiz.id, correct: choice.id === quiz.bestMoveId }
    ]);
  };

  const next = () => {
    setSelected(null);
    setIndex((current) => current + 1);
  };

  const swing = Math.abs(quiz.evaluationAfter - quiz.evaluationBefore);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>勝負手</Text>
            <Text style={styles.subtitle}>SHOGI DECISION QUIZ</Text>
          </View>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>{index + 1} / {quizzes.length}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{quiz.source}</Text>
          <Text style={styles.meta}>{quiz.moveNumber}手目</Text>
        </View>

        <View style={styles.boardCard}>
          <ShogiBoard sfen={quiz.sfen} reversed={quiz.sideToMove === 'white'} />
          <View style={styles.turnBadge}>
            <Text style={styles.turnText}>{quiz.sideToMove === 'black' ? '先手番' : '後手番'}</Text>
          </View>
        </View>

        <Text style={styles.question}>この局面、あなたならどう指す？</Text>
        <Text style={styles.hint}>実戦ではここから評価値が {swing} 点動きました</Text>

        <View style={styles.choices}>
          {quiz.choices.map((choice, choiceIndex) => {
            const isSelected = selected?.id === choice.id;
            const isCorrect = selected && choice.id === quiz.bestMoveId;
            return (
              <Pressable
                key={choice.id}
                accessibilityRole="button"
                disabled={Boolean(selected)}
                onPress={() => answer(choice)}
                style={[
                  styles.choice,
                  isSelected && styles.selectedChoice,
                  isCorrect && styles.correctChoice
                ]}
              >
                <Text style={styles.choiceLetter}>{choiceIndex === 0 ? 'A' : 'B'}</Text>
                <Text style={styles.choiceText}>{choice.notation}</Text>
                {isCorrect ? <Text style={styles.correctMark}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>

        {selected ? (
          <View style={styles.explanationCard}>
            <Text style={styles.verdict}>
              {selected.id === quiz.bestMoveId ? '正解！ 最善手です' : '惜しい！ こちらが実戦手です'}
            </Text>
            <Text style={styles.explanation}>{quiz.explanation}</Text>
            <Pressable style={styles.primaryButton} onPress={next}>
              <Text style={styles.primaryButtonText}>
                {index === quizzes.length - 1 ? '結果を見る' : '次の局面へ'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  ink: '#1D2521',
  paper: '#F5F0E5',
  green: '#28483B',
  lightGreen: '#DCE6DF',
  orange: '#D36B37',
  muted: '#746E62'
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  page: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 30, lineHeight: 34, fontWeight: '900', color: colors.ink, letterSpacing: 2 },
  subtitle: { fontSize: 10, fontWeight: '700', color: colors.orange, letterSpacing: 1.5 },
  progressPill: { backgroundColor: colors.green, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14 },
  progressText: { color: '#FFFDF7', fontWeight: '800' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  boardCard: { position: 'relative', borderRadius: 6, padding: 10, backgroundColor: '#3B2A21' },
  turnBadge: { position: 'absolute', left: 20, bottom: 20, backgroundColor: colors.orange, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3 },
  turnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  question: { marginTop: 24, fontSize: 22, fontWeight: '900', color: colors.ink },
  hint: { marginTop: 6, fontSize: 13, lineHeight: 19, color: colors.muted },
  choices: { marginTop: 17, gap: 10 },
  choice: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#C8C0B0', borderRadius: 8, backgroundColor: '#FFFCF5', paddingHorizontal: 14 },
  selectedChoice: { borderColor: colors.orange },
  correctChoice: { borderColor: colors.green, backgroundColor: colors.lightGreen },
  choiceLetter: { width: 31, height: 31, textAlign: 'center', lineHeight: 31, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.ink, color: '#fff', fontWeight: '900' },
  choiceText: { marginLeft: 14, flex: 1, fontSize: 19, fontWeight: '800', color: colors.ink },
  correctMark: { color: colors.green, fontSize: 24, fontWeight: '900' },
  explanationCard: { marginTop: 16, borderLeftWidth: 4, borderLeftColor: colors.orange, padding: 16, backgroundColor: '#ECE4D6' },
  verdict: { fontSize: 17, fontWeight: '900', color: colors.ink },
  explanation: { marginTop: 8, color: '#504A41', fontSize: 14, lineHeight: 22 },
  primaryButton: { marginTop: 18, alignItems: 'center', paddingVertical: 15, borderRadius: 6, backgroundColor: colors.green },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  result: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: colors.paper },
  eyebrow: { color: colors.orange, fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  resultTitle: { marginTop: 8, fontSize: 30, fontWeight: '900', color: colors.ink },
  resultScore: { marginTop: 24, fontSize: 64, fontWeight: '900', color: colors.green },
  resultCopy: { marginTop: 8, color: colors.muted, fontSize: 15, lineHeight: 24 }
});
