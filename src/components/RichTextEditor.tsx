import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const buttonBase =
  'rounded-md border border-border px-2 py-1 text-xs font-medium transition hover:bg-primary/10 hover:border-primary/50';

function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    content: value || '',
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const next = window.prompt('URL del enlace', previous ?? '');
    if (next === null) return;
    if (next.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: next.trim() }).run();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonBase} ${editor.isActive('bold') ? 'bg-muted text-foreground' : ''}`}
        >
          Negrita
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonBase} ${editor.isActive('italic') ? 'bg-muted text-foreground' : ''}`}
        >
          Cursiva
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${buttonBase} ${editor.isActive('heading', { level: 2 }) ? 'bg-muted text-foreground' : ''}`}
        >
          Titulo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${buttonBase} ${editor.isActive('heading', { level: 3 }) ? 'bg-muted text-foreground' : ''}`}
        >
          Subtitulo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonBase} ${editor.isActive('bulletList') ? 'bg-muted text-foreground' : ''}`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonBase} ${editor.isActive('orderedList') ? 'bg-muted text-foreground' : ''}`}
        >
          Lista numerada
        </button>
        <button type="button" onClick={setLink} className={buttonBase}>
          Enlace
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
