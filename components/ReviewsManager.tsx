"use client";

import { useState, useMemo, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { Plus, Trash2, Star, User } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { AppleButton } from '@/components/ui/apple-button';
import { AppleCard } from '@/components/ui/apple-card';

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  isManual: boolean;
  avatarUrl?: string;
  locale?: string; // "en-US" or "pt-BR"
}

interface ReviewsManagerProps {
    initialReviews: Review[];
    onReviewsChange: (reviews: Review[]) => void;
}

const ReviewsManager = ({ initialReviews, onReviewsChange }: ReviewsManagerProps) => {
    const { t, locale } = useLanguage() as { t: (k: string) => string; locale: 'en-US' | 'pt-BR' };
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
            { ...newReview, id: newId, rating: finalRating, isManual: true, locale },
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

    // Filter reviews to show only those matching current locale
    const filteredReviews = useMemo(() => {
        return reviews.filter(r => !r.locale || r.locale === locale);
    }, [reviews, locale]);

    // Calculate average based on filtered reviews
    const averageRatingFiltered = useMemo(() => {
        if (filteredReviews.length === 0) return 0;
        const total = filteredReviews.reduce((sum, review) => sum + review.rating, 0);
        return (total / filteredReviews.length);
    }, [filteredReviews]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <h4 className="text-xl font-semibold text-foreground">{(t('chip.reviewsEditor') || 'Reviews')} ({filteredReviews.length})</h4>
                <div className="flex items-center gap-1 text-foreground/80">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold">{averageRatingFiltered.toFixed(1)} / 5.0</span>
                </div>
            </div>

            {/* Lista de Reviews */}
            <div className="max-h-80 overflow-y-auto space-y-3 p-2">
                {filteredReviews.map(review => {
                    const isEditing = editingId === review.id;
                    return (
                        <AppleCard key={review.id} variant="glass" className="p-3 h-28">
                            <div className="h-full flex justify-between items-center gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-1 ring-foreground/15 shadow-sm bg-foreground/10 shrink-0">
                                        <img
                                          src={review.avatarUrl || '/avatar-reviews.jpeg'}
                                          alt={review.author || 'avatar'}
                                          className="w-full h-full object-cover object-center"
                                          onError={(e) => {
                                            const t = e.target as HTMLImageElement;
                                            if (!t.src.endsWith('/avatar-reviews.jpeg')) t.src = '/avatar-reviews.jpeg';
                                          }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground flex items-center gap-2 truncate">
                                            {review.author}
                                            {review.isManual && <span className="text-xs text-blue-500/80">(Manual)</span>}
                                        </p>
                                        <div className="mt-1 text-xs text-foreground/70 flex items-start gap-1">
                                            <span className="inline-flex items-center gap-1 text-yellow-500 shrink-0"><Star className="w-3.5 h-3.5 fill-yellow-500" /> {review.rating.toFixed(1)}</span>
                                            <span className="text-foreground/70 min-w-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                “{review.content}”
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AppleButton
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => startEdit(review)}
                                    >
                                        {t('common.edit') || 'Edit'}
                                    </AppleButton>
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
                        </AppleCard>
                    );
                })}
                {reviews.length === 0 && <p className="text-sm text-foreground/50 text-center py-4">{t('reviews.none') || 'Nenhuma avaliação ainda.'}</p>}
            </div>

            {/* Botão Adicionar */}
            <AppleButton
                type="button"
                variant="secondary"
                onClick={() => setIsAdding(true)}
                className="w-full"
            >
                <Plus className="w-4 h-4" />
                {t('reviews.addManual') || 'Adicionar Avaliação Manual'}
            </AppleButton>

            {/* Formulário de Adição */}
            {isAdding && (
                <AppleCard variant="glass" className="p-4 space-y-3">
                <form onSubmit={addReview} className="space-y-3">
                    <h5 className="text-md font-semibold text-foreground">{t('reviews.new') || 'Nova Review'}</h5>
                    <input 
                        type="text" 
                        name="author"
                        placeholder={t('reviews.authorPlaceholder') || 'Autor (ex: Admin ou Nome do Cliente)'}
                        value={newReview.author}
                        onChange={handleReviewChange}
                        className="w-full p-2 rounded-md bg-card border border-black/10 dark:border-white/10 text-foreground text-sm"
                        required
                    />
                    <div className="flex gap-3">
                        <input 
                            type="number" 
                            name="rating"
                            placeholder={t('reviews.ratingPlaceholder') || 'Nota (1-5)'}
                            value={newReview.rating}
                            onChange={handleReviewChange}
                            className="w-1/3 p-2 rounded-md bg-card border border-black/10 dark:border-white/10 text-foreground text-sm"
                            min="1" max="5" step="0.5"
                            required
                        />
                        <textarea 
                            name="content"
                            placeholder={t('reviews.contentPlaceholder') || 'Conteúdo da avaliação'}
                            value={newReview.content}
                            onChange={handleReviewChange}
                            className="w-2/3 p-2 rounded-md bg-card border border-black/10 dark:border-white/10 text-foreground text-sm resize-none"
                            rows={2}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <AppleButton type="button" variant="secondary" size="sm" onClick={() => setIsAdding(false)}>
                            {t('common.cancel') || 'Cancel'}
                        </AppleButton>
                        <AppleButton type="submit" variant="primary" size="sm">
                            {t('common.save') || 'Save Review'}
                        </AppleButton>
                    </div>
                </form>
                </AppleCard>
            )}

            {/* Modal de Edição da Review */}
            {isEditModalOpen && editDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <AppleCard variant="premium" className="w-full max-w-lg p-5 shadow-2xl">
                        <h5 className="text-lg font-semibold text-foreground">{t('reviews.edit') || 'Editar Avaliação'}</h5>
                        <div className="mt-4 grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-4">
                                                                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-foreground/15 shadow-sm bg-foreground/10">
                                    <img
                                      src={editDraft.avatarUrl || '/avatar-reviews.jpeg'}
                                      alt={editDraft.author || 'avatar'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const t = e.target as HTMLImageElement;
                                        if (!t.src.endsWith('/avatar-reviews.jpeg')) t.src = '/avatar-reviews.jpeg';
                                      }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={onPickAvatar} className="px-3 py-1.5 text-xs rounded-md bg-background border border-border text-foreground hover:bg-card/60">{editDraft.avatarUrl ? (t('reviews.avatar.change') || 'Trocar Avatar') : (t('reviews.avatar.add') || 'Adicionar Avatar')}</button>
                                    {editDraft.avatarUrl && (
                                        <button type="button" onClick={()=> setEditDraft(d=> ({ ...(d as any), avatarUrl: undefined }))} className="px-3 py-1.5 text-xs rounded-md bg-background border border-border text-foreground hover:bg-card/60">{t('common.remove') || 'Remover'}</button>
                                    )}
                                    <input ref={hiddenFileInput} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12 sm:col-span-6">
                                    <label className="block text-[11px] font-medium text-foreground/70 mb-1">{t('editor.user') || 'Usuário'}</label>
                                    <input type="text" value={editDraft.author} onChange={(e)=> setEditDraft(d=> ({ ...(d as any), author: e.target.value }))} className="w-full p-2 rounded-md bg-background border border-border text-foreground text-sm" required />
                                </div>
                                <div className="col-span-12 sm:col-span-6">
                                    <label className="block text-[11px] font-medium text-foreground/70 mb-1">{t('reviews.rating') || 'Nota (1-5)'}</label>
                                    <input type="number" min={1} max={5} step={0.5} value={editDraft.rating} onChange={(e)=> setEditDraft(d=> ({ ...(d as any), rating: parseFloat(e.target.value) }))} className="w-full p-2 rounded-md bg-background border border-border text-foreground text-sm" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-foreground/70 mb-1">{t('reviews.content') || 'Conteúdo'}</label>
                                <textarea value={editDraft.content} onChange={(e)=> setEditDraft(d=> ({ ...(d as any), content: e.target.value }))} className="w-full p-2 rounded-md bg-background border border-border text-foreground text-sm min-h-[120px]" />
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <AppleButton type="button" variant="secondary" onClick={cancelEdit}>{t('common.cancel') || 'Cancel'}</AppleButton>
                            <AppleButton type="button" variant="primary" onClick={saveEdit}>{t('common.save') || 'Save'}</AppleButton>
                        </div>
                    </AppleCard>
                </div>
            )}
        </div>
    );
};

export default ReviewsManager;