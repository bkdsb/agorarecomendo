"use client";

import { useState, useMemo, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { Plus, Trash2, Star, User } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  isManual: boolean;
    avatarUrl?: string;
}

interface ReviewsManagerProps {
    initialReviews: Review[];
    onReviewsChange: (reviews: Review[]) => void;
}

const ReviewsManager = ({ initialReviews, onReviewsChange }: ReviewsManagerProps) => {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    // Sincroniza quando o pai atualiza as reviews (ex.: importadas via scraping)
    useEffect(() => {
        setReviews(initialReviews);
    }, [initialReviews]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<{ author: string; rating: number; content: string; avatarUrl?: string } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const hiddenFileInput = useRef<HTMLInputElement | null>(null);
    const [newReview, setNewReview] = useState({ author: '', rating: 5, content: '' });

    // Calcula a média das avaliações
    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return (total / reviews.length);
    }, [reviews]);

    const handleReviewChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewReview(prev => ({ ...prev, [name]: name === 'rating' ? parseFloat(value) : value }));
    };

    const addReview = (e: FormEvent) => {
        e.preventDefault();
        const newId = `manual-${Date.now()}`;
        const finalRating = Math.min(5, Math.max(1, newReview.rating));

        const updatedReviews = [
            ...reviews,
            { ...newReview, id: newId, rating: finalRating, isManual: true },
        ];
        setReviews(updatedReviews);
        onReviewsChange(updatedReviews);
        setIsAdding(false);
        setNewReview({ author: '', rating: 5, content: '' });
    };

    const removeReview = (id: string) => {
        const updatedReviews = reviews.filter(r => r.id !== id);
        setReviews(updatedReviews);
        onReviewsChange(updatedReviews);
    };

    const startEdit = (r: Review) => {
        setEditingId(r.id);
        setEditDraft({ author: r.author, rating: r.rating, content: r.content, avatarUrl: r.avatarUrl });
        setIsEditModalOpen(true);
    };

    const cancelEdit = () => {
        setIsEditModalOpen(false);
        setEditingId(null);
        setEditDraft(null);
    };

    const saveEdit = () => {
        if (!editingId || !editDraft) return;
        const finalRating = Math.min(5, Math.max(1, Number(editDraft.rating || 0)));
        const updated = reviews.map(r => r.id === editingId ? { ...r, author: editDraft.author, rating: finalRating, content: editDraft.content, avatarUrl: editDraft.avatarUrl } : r);
        setReviews(updated);
        onReviewsChange(updated);
        setIsEditModalOpen(false);
        setEditingId(null);
        setEditDraft(null);
    };

    const onPickAvatar = () => {
        hiddenFileInput.current?.click();
    };

    const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            if (!res.ok) throw new Error('Failed to upload image');
            const json = await res.json();
            setEditDraft((d) => ({ ...(d as any), avatarUrl: json.url }));
        } catch (err) {
            // silent: parent will show toast if needed
        } finally {
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <h4 className="text-xl font-semibold text-foreground">Reviews ({reviews.length})</h4>
                <div className="flex items-center gap-1 text-foreground/80">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold">{averageRating.toFixed(1)} / 5.0</span>
                </div>
            </div>

            {/* Lista de Reviews */}
            <div className="max-h-80 overflow-y-auto space-y-3 p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
                {reviews.map(review => {
                    const isEditing = editingId === review.id;
                    return (
                        <div key={review.id} className="p-3 bg-card rounded-md shadow-sm">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-foreground/10 overflow-hidden flex items-center justify-center">
                                        {review.avatarUrl ? (
                                            <img src={review.avatarUrl} alt={review.author} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-4 h-4 text-foreground/60" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            {review.author}
                                            {review.isManual && <span className="text-xs text-blue-500/80">(Manual)</span>}
                                        </p>
                                        <p className="text-xs text-foreground/70 mt-1">
                                            <span className="text-yellow-500 mr-1">{review.rating.toFixed(1)}⭐</span>
                                            "{review.content.substring(0, 120)}{review.content.length > 120 ? '...' : ''}"
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(review)}
                                        className="px-3 py-1.5 text-xs rounded-md bg-background border border-border text-foreground hover:bg-card/60"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => removeReview(review.id)}
                                        className="p-1.5 text-red-500 hover:text-red-700 transition-colors rounded-md hover:bg-red-500/10"
                                        aria-label="Remover avaliação"
                                        type="button"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {reviews.length === 0 && <p className="text-sm text-foreground/50 text-center py-4">Nenhuma avaliação ainda.</p>}
            </div>

            {/* Botão Adicionar */}
            <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-background border border-border text-foreground hover:bg-card/60 transition-colors"
            >
                <Plus className="w-4 h-4" />
                Adicionar Avaliação Manual
            </button>

            {/* Formulário de Adição */}
            {isAdding && (
                <form onSubmit={addReview} className="p-4 bg-cinza-espacial/50 rounded-lg space-y-3">
                    <h5 className="text-md font-semibold text-foreground">Nova Review</h5>
                    <input 
                        type="text" 
                        name="author"
                        placeholder="Autor (ex: Admin ou Nome do Cliente)"
                        value={newReview.author}
                        onChange={handleReviewChange}
                        className="w-full p-2 rounded-md bg-card border border-black/10 dark:border-white/10 text-foreground text-sm"
                        required
                    />
                    <div className="flex gap-3">
                        <input 
                            type="number" 
                            name="rating"
                            placeholder="Nota (1-5)"
                            value={newReview.rating}
                            onChange={handleReviewChange}
                            className="w-1/3 p-2 rounded-md bg-card border border-black/10 dark:border-white/10 text-foreground text-sm"
                            min="1" max="5" step="0.5"
                            required
                        />
                        <textarea 
                            name="content"
                            placeholder="Conteúdo da avaliação"
                            value={newReview.content}
                            onChange={handleReviewChange}
                            className="w-2/3 p-2 rounded-md bg-card border border-black/10 dark:border-white/10 text-foreground text-sm resize-none"
                            rows={2}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm rounded-md bg-background border border-border text-foreground hover:bg-card/60 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">
                            Salvar Review
                        </button>
                    </div>
                </form>
            )}

            {/* Modal de Edição da Review */}
            {isEditModalOpen && editDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-card/70 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-lg p-5 border border-border">
                        <h5 className="text-lg font-semibold text-foreground">Editar Avaliação</h5>
                        <div className="mt-4 grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-foreground/10 flex items-center justify-center">
                                    {editDraft.avatarUrl ? (
                                        <img src={editDraft.avatarUrl} alt={editDraft.author || 'avatar'} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-foreground/60" />
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={onPickAvatar} className="px-3 py-1.5 text-xs rounded-md bg-background border border-border text-foreground hover:bg-card/60">{editDraft.avatarUrl ? 'Trocar Avatar' : 'Adicionar Avatar'}</button>
                                    {editDraft.avatarUrl && (
                                        <button type="button" onClick={()=> setEditDraft(d=> ({ ...(d as any), avatarUrl: undefined }))} className="px-3 py-1.5 text-xs rounded-md bg-background border border-border text-foreground hover:bg-card/60">Remover</button>
                                    )}
                                    <input ref={hiddenFileInput} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12 sm:col-span-6">
                                    <label className="block text-[11px] font-medium text-foreground/70 mb-1">Autor</label>
                                    <input type="text" value={editDraft.author} onChange={(e)=> setEditDraft(d=> ({ ...(d as any), author: e.target.value }))} className="w-full p-2 rounded-md bg-background border border-border text-foreground text-sm" required />
                                </div>
                                <div className="col-span-12 sm:col-span-6">
                                    <label className="block text-[11px] font-medium text-foreground/70 mb-1">Nota (1-5)</label>
                                    <input type="number" min={1} max={5} step={0.5} value={editDraft.rating} onChange={(e)=> setEditDraft(d=> ({ ...(d as any), rating: parseFloat(e.target.value) }))} className="w-full p-2 rounded-md bg-background border border-border text-foreground text-sm" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-foreground/70 mb-1">Conteúdo</label>
                                <textarea value={editDraft.content} onChange={(e)=> setEditDraft(d=> ({ ...(d as any), content: e.target.value }))} className="w-full p-2 rounded-md bg-background border border-border text-foreground text-sm min-h-[120px]" />
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-md bg-background border border-border text-foreground hover:bg-card/60">Cancelar</button>
                            <button type="button" onClick={saveEdit} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsManager;