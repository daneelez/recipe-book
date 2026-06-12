/**
 * Исправленная версия: рендер текста без dangerouslySetInnerHTML.
 */

type Props = { text: string };

export function SafeTextBlock({ text }: Props) {
  return <div>{text}</div>;
}
