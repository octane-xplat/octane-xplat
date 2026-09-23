import { useState, useRef } from 'octane';
import { View, Row, Text, Pressable, TextInput, List } from '@octane-xplat/ui';

type Todo = { id: string; text: string; done: boolean };

/** todo-jsx — the canonical keyed-mutation stress.
 *  Proves: List leaf under insert/remove/toggle (exercises the driver's
 *  managed-ObservableArray splice+refresh patch on native), controlled
 *  TextInput round-trip, @if empty-state. renderItem is a fresh closure
 *  per commit — safe because the leaf reads it off the host view at
 *  itemLoading time and every mutation changes `items` identity. */
export function Todo() @{
	const [todos, setTodos] = useState<Todo[]>([]);
	const [draft, setDraft] = useState('');
	const nextId = useRef(0);

	const add = () => {
		const text = draft.trim();
		if (!text) return;
		console.log('[probe] todo add ' + text);
		setTodos([...todos, { id: 't' + ++nextId.current, text, done: false }]);
		setDraft('');
	};
	const toggle = (id: string) =>
		setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
	const remove = (id: string) => setTodos(todos.filter((t) => t.id !== id));

	const renderTodo = (t: Todo) => (
		<Row className="cell gap-2 items-center">
			<Pressable onPress={() => toggle(t.id)}>
				<Text className="todo-check">{t.done ? '✓' : '○'}</Text>
			</Pressable>
			<Text className={['flex-1', t.done ? 'todo-done' : '']}>{t.text}</Text>
			<Pressable onPress={() => remove(t.id)}>
				<Text className="todo-check">{'✕'}</Text>
			</Pressable>
		</Row>
	);

	<View className="vx-app flex-1 gap-4">
		<Row className="gap-2">
			<TextInput
				value={draft}
				onChange={(v) => setDraft(v)}
				placeholder="Add a todo"
				className="input flex-1"
			/>
			<Pressable id="todo-add" onPress={add} className="btn bg-primary">
				<Text className="text-onprimary">Add</Text>
			</Pressable>
		</Row>
		@if (todos.length === 0) {
			<Text className="cell">Nothing yet — add one.</Text>
		}
		<List id="todo-list" className="list flex-1" items={todos} renderItem={renderTodo} />
	</View>
}
