import React, { useEffect, useState, FormEvent } from 'react';
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../services/adminService';
import { Category, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';

export const AdminManageCategoriesPage: React.FC = () => {
  const { t } = useTranslation('adminManageCategoriesPage');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [formState, setFormState] = useState<Partial<Category>>({ name: '', slug: '', is_active: true });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionRow, setActionRow] = useState<number | null>(null);

  const fetchCategories = () => {
    setIsLoading(true);
    adminGetCategories()
      .then(res => setCategories(res.data))
      .catch((err: any) => setError((err as ApiError).message || t('error.loadFailed')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreateOrUpdateCategory = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editCategory) {
        await adminUpdateCategory(editCategory.id, formState);
      } else {
        await adminCreateCategory(formState);
      }
      fetchCategories();
      setShowForm(false);
      setEditCategory(null);
      setFormState({ name: '', slug: '', is_active: true });
    } catch (err) {
      setError(t('error.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setFormState({ ...category });
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(t('confirmDelete'))) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await adminDeleteCategory(category.id);
      fetchCategories();
    } catch (err) {
      setError(t('error.deleteFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side filter for now
  let filteredCategories = categories;
  if (search) {
    filteredCategories = categories.filter(
      c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (isLoading) return <LoadingSpinner message={t('loadingCategories')} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header + Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">{t('title')}</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            className="border border-yellow-200 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            placeholder={t('searchPlaceholder') || 'Search by name or slug...'}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
          />
          <Button onClick={() => setSearch(searchInput)} variant="primary">{t('actions.search') || 'Search'}</Button>
          {search && <Button onClick={() => { setSearch(''); setSearchInput(''); }} variant="outline">{t('actions.clear') || 'Clear'}</Button>}
          <Button onClick={() => { setShowForm(prev => !prev); setEditCategory(null); setFormState({ name: '', slug: '', is_active: true }); }} variant={showForm ? "secondary" : "primary"}>
            {showForm ? t('actions.cancel') : t('actions.addNew')}
          </Button>
        </div>
      </div>
      {/* Form */}
      {showForm && (
        <Card className="mb-8 border border-yellow-100 shadow-xl">
          <CardContent>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-700">{editCategory ? <svg className='h-5 w-5 text-yellow-400' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 10h16M4 14h16M4 18h16' /></svg> : <svg className='h-5 w-5 text-yellow-400' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' /></svg>}{editCategory ? t('form.editTitle') : t('form.addTitle')}</h2>
            <form onSubmit={handleCreateOrUpdateCategory} className="space-y-4">
              <InputField label={t('form.name')} name="name" value={formState.name || ''} onChange={handleInputChange} required />
              <InputField label={t('form.slug')} name="slug" value={formState.slug || ''} onChange={handleInputChange} required />
              <InputField label={t('form.description')} name="description" value={formState.description || ''} onChange={handleInputChange} />
              <InputField label={t('form.iconUrl')} name="icon_url" value={formState.icon_url || ''} onChange={handleInputChange} />
              <InputField label={t('form.imageUrl')} name="image_url" value={formState.image_url || ''} onChange={handleInputChange} />
              <InputField label={t('form.sortOrder')} name="sort_order" type="number" value={formState.sort_order || 0} onChange={handleInputChange} />
              <div className="flex items-center">
                <input type="checkbox" id="is_active" name="is_active" checked={!!formState.is_active} onChange={handleInputChange} className="h-4 w-4 text-yellow-600"/>
                <label htmlFor="is_active" className="ml-2">{t('form.active')}</label>
              </div>
              <Button type="submit" isLoading={isSubmitting}>{editCategory ? t('actions.update') : t('actions.create')}</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {/* Table Card */}
      <div className="bg-white shadow-xl rounded-xl overflow-x-auto border border-yellow-100 p-2 md:p-4">
        <table className="min-w-full divide-y divide-yellow-100 text-sm">
          <thead className="bg-yellow-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-yellow-700 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left font-bold text-yellow-700 uppercase tracking-wider">{t('table.name')}</th>
              <th className="px-4 py-3 text-left font-bold text-yellow-700 uppercase tracking-wider">{t('table.slug')}</th>
              <th className="px-4 py-3 text-left font-bold text-yellow-700 uppercase tracking-wider">{t('table.status')}</th>
              <th className="px-4 py-3 text-left font-bold text-yellow-700 uppercase tracking-wider">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-yellow-50">
            {filteredCategories.map(category => (
              <tr key={category.id} className="hover:bg-yellow-50 transition-colors group">
                <td className="px-4 py-3 whitespace-nowrap">{category.id}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">{category.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{category.slug}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${category.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                    {category.is_active ? t('status.active') : t('status.inactive')}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-medium relative">
                  <div className="relative inline-block text-left">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionRow(actionRow === category.id ? null : category.id)}
                      className="min-w-[2.5rem]"
                    >
                      <span className="sr-only">Actions</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="19.5" cy="12" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/></svg>
                    </Button>
                    {actionRow === category.id && (
                      <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          <button onClick={() => { handleEdit(category); setActionRow(null); }} className="block w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50">{t('actions.edit')}</button>
                          <button onClick={() => { handleDelete(category); setActionRow(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-yellow-50">{t('actions.delete')}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
