import React, { useEffect, useState, FormEvent } from 'react';
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../services/adminService';
import { Category, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTags, 
  FaSearch, 
  FaTimes, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaEllipsisV,
  FaEye,
  FaEyeSlash,
  FaSort,
  FaFilter
} from 'react-icons/fa';

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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');

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

  // Client-side filtering
  let filteredCategories = categories;
  if (search) {
    filteredCategories = categories.filter(
      c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply status filter
  if (selectedFilter !== 'all') {
    filteredCategories = filteredCategories.filter(c => {
      switch (selectedFilter) {
        case 'active':
          return c.is_active;
        case 'inactive':
          return !c.is_active;
        default:
          return true;
      }
    });
  }

  const stats = {
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    inactive: categories.filter(c => !c.is_active).length,
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <LoadingSpinner message={t('loadingCategories')} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <ErrorMessage message={error} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto p-4 md:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-600">
                  <FaTags className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    {t('title')}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {t('manageCategoriesDescription')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => { 
                    setShowForm(prev => !prev); 
                    setEditCategory(null); 
                    setFormState({ name: '', slug: '', is_active: true }); 
                  }} 
                  variant={showForm ? "secondary" : "primary"}
                  className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  {showForm ? t('actions.cancel') : t('actions.addNew')}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">{t('stats.totalCategories')}</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <FaTags className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">{t('stats.activeCategories')}</p>
                    <p className="text-3xl font-bold">{stats.active}</p>
                  </div>
                  <FaCheck className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">{t('stats.inactiveCategories')}</p>
                    <p className="text-3xl font-bold">{stats.inactive}</p>
                  </div>
                  <FaEyeSlash className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('searchPlaceholder')}
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: t('filters.allCategories'), icon: <FaTags className="h-4 w-4" /> },
                  { key: 'active', label: t('filters.active'), icon: <FaCheck className="h-4 w-4" /> },
                  { key: 'inactive', label: t('filters.inactive'), icon: <FaEyeSlash className="h-4 w-4" /> }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedFilter === filter.key
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.icon}
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSearch(searchInput)} 
                  variant="primary"
                  className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700"
                >
                  <FaSearch className="h-4 w-4 mr-2" />
                  {t('actions.search')}
                </Button>
                {(search || selectedFilter !== 'all') && (
                  <Button 
                    onClick={() => { 
                      setSearch(''); 
                      setSearchInput(''); 
                      setSelectedFilter('all');
                    }} 
                    variant="outline"
                  >
                    <FaTimes className="h-4 w-4 mr-2" />
                    {t('actions.clear')}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <Card className="bg-white shadow-xl border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-600">
                        {editCategory ? (
                          <FaEdit className="h-5 w-5 text-white" />
                        ) : (
                          <FaPlus className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {editCategory ? t('form.editTitle') : t('form.addTitle')}
                      </h2>
                    </div>
                    
                    <form onSubmit={handleCreateOrUpdateCategory} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                          label={t('form.name')} 
                          name="name" 
                          value={formState.name || ''} 
                          onChange={handleInputChange} 
                          required 
                        />
                        <InputField 
                          label={t('form.slug')} 
                          name="slug" 
                          value={formState.slug || ''} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      
                      <InputField 
                        label={t('form.description')} 
                        name="description" 
                        value={formState.description || ''} 
                        onChange={handleInputChange} 
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                          label={t('form.iconUrl')} 
                          name="icon_url" 
                          value={formState.icon_url || ''} 
                          onChange={handleInputChange} 
                        />
                        <InputField 
                          label={t('form.imageUrl')} 
                          name="image_url" 
                          value={formState.image_url || ''} 
                          onChange={handleInputChange} 
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                          label={t('form.sortOrder')} 
                          name="sort_order" 
                          type="number" 
                          value={formState.sort_order || 0} 
                          onChange={handleInputChange} 
                        />
                        <div className="flex items-center space-x-3">
                          <input 
                            type="checkbox" 
                            id="is_active" 
                            name="is_active" 
                            checked={!!formState.is_active} 
                            onChange={handleInputChange} 
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            {t('form.active')}
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          isLoading={isSubmitting}
                          className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700"
                        >
                          {editCategory ? t('actions.update') : t('actions.create')}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setShowForm(false);
                            setEditCategory(null);
                            setFormState({ name: '', slug: '', is_active: true });
                          }}
                        >
                          {t('actions.cancel')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.id')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.name')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.slug')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.status')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  <AnimatePresence>
                    {filteredCategories && filteredCategories.length > 0 ? (
                      filteredCategories.map((category, index) => (
                        <motion.tr
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-600 flex items-center justify-center">
                                  <FaTags className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {category.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                            {category.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {category.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">
                              {category.slug}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              category.is_active 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {category.is_active ? (
                                <>
                                  <FaCheck className="h-3 w-3 mr-1" />
                                  {t('status.active')}
                                </>
                              ) : (
                                <>
                                  <FaEyeSlash className="h-3 w-3 mr-1" />
                                  {t('status.inactive')}
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                            <div className="relative inline-block text-left">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActionRow(actionRow === category.id ? null : category.id)}
                                className="min-w-[2.5rem] hover:bg-gray-100"
                              >
                                <FaEllipsisV className="h-4 w-4" />
                              </Button>
                              
                              <AnimatePresence>
                                {actionRow === category.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-100"
                                  >
                                    <div className="py-2">
                                      <button 
                                        onClick={() => { handleEdit(category); setActionRow(null); }} 
                                        className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                                      >
                                        <FaEdit className="h-4 w-4 mr-2" />
                                        {t('actions.edit')}
                                      </button>
                                      <button 
                                        onClick={() => { handleDelete(category); setActionRow(null); }} 
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <FaTrash className="h-4 w-4 mr-2" />
                                        {t('actions.delete')}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <td colSpan={5} className="text-center text-gray-400 py-12">
                          <div className="flex flex-col items-center">
                            <FaTags className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">{t('noCategoriesFound')}</p>
                            <p className="text-sm text-gray-500">{t('noCategoriesMatch')}</p>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};
