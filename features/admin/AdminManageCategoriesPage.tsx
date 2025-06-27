import React, { useEffect, useState, FormEvent } from 'react';
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../services/adminService';
import { Category, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';

export const AdminManageCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [formState, setFormState] = useState<Partial<Category>>({ name: '', slug: '', is_active: true });

  const fetchCategories = () => {
    setIsLoading(true);
    adminGetCategories()
      .then(res => setCategories(res.data))
      .catch((err: any) => setError((err as ApiError).message || 'Failed to load categories.'))
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
      setError('Failed to save category.');
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
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await adminDeleteCategory(category.id);
      fetchCategories();
    } catch (err) {
      setError('Failed to delete category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading categories..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Manage Categories</h1>
      </div>
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      <Button onClick={() => { setShowForm(prev => !prev); setEditCategory(null); setFormState({ name: '', slug: '', is_active: true }); }} variant={showForm ? "secondary" : "primary"} className="mb-6">
        {showForm ? 'Cancel' : 'Add New Category'}
      </Button>
      {showForm && (
        <Card className="mb-8 border border-yellow-100 shadow-xl">
          <CardContent>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-700">{editCategory ? <svg className='h-5 w-5 text-yellow-400' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 10h16M4 14h16M4 18h16' /></svg> : <svg className='h-5 w-5 text-yellow-400' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' /></svg>}{editCategory ? 'Edit Category' : 'Add New Category'}</h2>
            <form onSubmit={handleCreateOrUpdateCategory} className="space-y-4">
              <InputField label="Name" name="name" value={formState.name || ''} onChange={handleInputChange} required />
              <InputField label="Slug" name="slug" value={formState.slug || ''} onChange={handleInputChange} required />
              <InputField label="Description" name="description" value={formState.description || ''} onChange={handleInputChange} />
              <InputField label="Icon URL" name="icon_url" value={formState.icon_url || ''} onChange={handleInputChange} />
              <InputField label="Image URL" name="image_url" value={formState.image_url || ''} onChange={handleInputChange} />
              <InputField label="Sort Order" name="sort_order" type="number" value={formState.sort_order || 0} onChange={handleInputChange} />
              <div className="flex items-center">
                <input type="checkbox" id="is_active" name="is_active" checked={!!formState.is_active} onChange={handleInputChange} className="h-4 w-4 text-yellow-600"/>
                <label htmlFor="is_active" className="ml-2">Active</label>
              </div>
              <Button type="submit" isLoading={isSubmitting}>{editCategory ? 'Update' : 'Create'} Category</Button>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="bg-white shadow-xl rounded-xl overflow-x-auto border border-yellow-100">
        <table className="min-w-full divide-y divide-yellow-100">
          <thead className="bg-yellow-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-yellow-700 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-yellow-700 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-yellow-700 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-yellow-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-yellow-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-yellow-50">
            {categories.map(category => (
              <tr key={category.id} className="hover:bg-yellow-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{category.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{category.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{category.slug}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${category.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(category)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
