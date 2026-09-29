function CardRoot(props: { title: string }) @{
	<div>{props.title}</div>
}

function CardHeader(props: { text: string }) @{
	<span>{props.text}</span>
}

export const Card = Object.assign(CardRoot, { Header: CardHeader })
