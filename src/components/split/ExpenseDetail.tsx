import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { supabase } from '../../lib/supabase';
import {
  fetchComments,
  addComment,
  fetchExpenseTags,
  type SplitExpense,
  type SplitMember,
  type SplitCategory,
  type SplitTag,
} from '../../services/split';

type ExpenseDetailProps = {
  expense: SplitExpense;
  members: SplitMember[];
  categories: SplitCategory[];
  tags: SplitTag[];
  shares: Array<{ member_id: string; amount: number }>;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

type ExpenseComment = {
  id: string;
  member_id: string;
  comment: string;
  created_at: string;
};


export function ExpenseDetail({
  expense,
  members,
  categories,
  tags,
  shares,
  onClose,
  onEdit,
  onDelete,
}: ExpenseDetailProps) {
  const [comments, setComments] = useState<ExpenseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [expenseTagIds, setExpenseTagIds] = useState<string[]>([]);

  useEffect(() => {
    void loadComments();
    void loadCurrentMember();
    void loadExpenseTags();
  }, [expense.id]);

  const loadComments = async () => {
    const data = await fetchComments(expense.id);
    setComments(data);
  };

  const loadCurrentMember = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const member = members.find(m => m.user_id === data.user.id);
      if (member) setCurrentMemberId(member.id);
    }
  };

  const loadExpenseTags = async () => {
    const tagIds = await fetchExpenseTags(expense.id);
    setExpenseTagIds(tagIds);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentMemberId) return;
    try {
      setIsAddingComment(true);
      await addComment(expense.id, currentMemberId, newComment.trim());
      setNewComment('');
      await loadComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al añadir comentario');
    } finally {
      setIsAddingComment(false);
    }
  };

  const payer = members.find(m => m.id === expense.payer_id);
  const category = categories.find(c => c.id === expense.category_id);
  const expenseTags = tags.filter(t => expenseTagIds.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{expense.title}</CardTitle>
              <CardDescription>
                {new Date(expense.expense_date || expense.created_at).toLocaleDateString('es-ES')}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Importe</label>
              <p className="text-lg font-semibold">{Number(expense.amount).toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Pagador</label>
              <p className="text-lg">{payer?.name || 'Desconocido'}</p>
            </div>
            {category && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                <p className="text-lg">{category.name}</p>
              </div>
            )}
            {expenseTags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Etiquetas</label>
                <div className="flex flex-wrap gap-2">
                  {expenseTags.map(tag => (
                    <span key={tag.id} className="rounded-full bg-primary/10 px-2 py-1 text-xs">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">División</label>
            <div className="space-y-1">
              {shares.map(share => {
                const member = members.find(m => m.id === share.member_id);
                return (
                  <div key={share.member_id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                    <span>{member?.name || 'Desconocido'}</span>
                    <span className="font-medium">{Number(share.amount).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {expense.receipt_url && (
            <div>
              <label className="mb-2 block text-sm font-medium">Recibo</label>
              <img src={expense.receipt_url} alt="Recibo" className="max-w-full rounded border" />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Comentarios</label>
            <div className="space-y-2">
              {comments.map(comment => {
                const member = members.find(m => m.id === comment.member_id);
                return (
                  <div key={comment.id} className="rounded border border-border p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{member?.name || 'Desconocido'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{comment.comment}</p>
                  </div>
                );
              })}
            </div>
            {currentMemberId && (
              <div className="mt-2 flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Añadir comentario..."
                  className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleAddComment();
                    }
                  }}
                />
                <Button onClick={handleAddComment} disabled={isAddingComment || !newComment.trim()}>
                  Enviar
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit} className="flex-1">
                Editar
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={onDelete} className="flex-1">
                Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
