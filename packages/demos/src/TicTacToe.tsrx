import { useState } from 'octane';
import { View, Row, Text, Pressable } from '@xplat/ui';

const WIN = [
	[0, 1, 2], [3, 4, 5], [6, 7, 8],
	[0, 3, 6], [1, 4, 7], [2, 5, 8],
	[0, 4, 8], [2, 4, 6],
];

function winnerOf(b: string[]): string | null {
	for (const [a, c, d] of WIN) {
		if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
	}
	return b.every((c) => c) ? 'draw' : null;
}

/** tic-tac-toe — deterministic game state, zero effects.
 *  Proves: a 3×3 grid of identical Pressables via keyed @for over a wrap
 *  container, pure derived state (winner + status computed in render — no
 *  useMemo needed at this size). Status is a ternary-derived string: the
 *  original @if/@else-if version hit a universal-codegen bug where @else-if
 *  branches discard their output (docs/demos.md findings). */
export function TicTacToe() @{
	const [board, setBoard] = useState<string[]>(Array(9).fill(''));
	const [xNext, setXNext] = useState(true);
	const winner = winnerOf(board);

	const play = (i: number) => {
		if (board[i] || winner) return;
		const next = board.slice();
		next[i] = xNext ? 'X' : 'O';
		console.log('[probe] ttt play ' + i + ' -> ' + next[i]);
		setBoard(next);
		setXNext(!xNext);
	};
	const reset = () => { setBoard(Array(9).fill('')); setXNext(true); };

	const status = winner === 'draw'
		? 'Draw.'
		: winner
			? winner + ' wins.'
			: (xNext ? 'X' : 'O') + ' to play';

	<View className="vx-app flex-1 gap-4 items-center">
		<Text className="text-xl font-bold">{status}</Text>
		<View className="ttt-grid">
			@for (const cell of board; index i; key i) {
				<Pressable id={'ttt-' + i} onPress={() => play(i)} className="ttt-cell">
					<Text className="ttt-mark">{cell}</Text>
				</Pressable>
			}
		</View>
		<Pressable id="ttt-reset" onPress={reset} className="btn bg-primary">
			<Text className="text-onprimary">Reset</Text>
		</Pressable>
	</View>
}
