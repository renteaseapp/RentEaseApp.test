import React, { useEffect, useState } from 'react';
import { adminGetStaticPages, adminUpdateStaticPage } from '../../services/adminService';
import { StaticPageContent, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

export const AdminManageStaticContentPage: React.FC = () => {
  const [pages, setPages] = useState<StaticPageContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editPage, setEditPage] = useState<StaticPageContent | null>(null);
  const [formState, setFormState] = useState<Partial<StaticPageContent>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaticPages = () => {
    setIsLoading(true);
    adminGetStaticPages()
      .then(res => setPages(res.data))
      .catch((err: any) => setError(err.message || 'Failed to load static pages.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStaticPages();
  }, []);

  const handleEdit = (page: StaticPageContent) => {
    setEditPage(page);
    setFormState({ ...page });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPage) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await adminUpdateStaticPage(editPage.slug, {
        ...formState,
        updated_by_admin_id: 1 // TODO: ใช้ admin id จริงจาก context
      } as any);
      fetchStaticPages();
      setEditPage(null);
      setFormState({});
    } catch (err) {
      setError('Failed to update static page.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading static content..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Static Content (CMS)</h1>
      <div className="space-y-4">
        {pages.map(page => (
          <Card key={page.slug}>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">{page.title}</h2>
                  <p className="text-sm text-gray-500">Slug: /{page.slug}</p>
                  <p className="text-xs text-gray-400">Last Updated: {new Date(page.updated_at).toLocaleString()}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(page)}>
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editPage && (
        <Card className="mt-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Edit Static Page: {editPage.title}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="title" value={formState.title || ''} onChange={handleChange} placeholder="Title" className="w-full border rounded p-2" />
              <input type="text" name="title_en" value={formState.title_en || ''} onChange={handleChange} placeholder="Title (EN)" className="w-full border rounded p-2" />
              <textarea name="content_html" value={formState.content_html || ''} onChange={handleChange} placeholder="HTML Content" className="w-full border rounded p-2" rows={6} />
              <textarea name="content_html_en" value={formState.content_html_en || ''} onChange={handleChange} placeholder="HTML Content (EN)" className="w-full border rounded p-2" rows={6} />
              <input type="text" name="meta_title" value={formState.meta_title || ''} onChange={handleChange} placeholder="Meta Title" className="w-full border rounded p-2" />
              <input type="text" name="meta_description" value={formState.meta_description || ''} onChange={handleChange} placeholder="Meta Description" className="w-full border rounded p-2" />
              <div className="flex items-center">
                <input type="checkbox" id="is_published" name="is_published" checked={!!formState.is_published} onChange={e => setFormState(prev => ({ ...prev, is_published: e.target.checked }))} className="h-4 w-4 text-blue-600" />
                <label htmlFor="is_published" className="ml-2">Published</label>
              </div>
              <Button type="submit" isLoading={isSubmitting} variant="primary">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => { setEditPage(null); setFormState({}); }}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
