/**
 * Намеренная XSS-уязвимость для демонстрации SAST (Semgrep).
 * Компонент не импортируется в приложение — только для статического анализа.
 */

type Props = { html: string };

export function UnsafeHtmlBlock({ html }: Props) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
