import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Save, X, ChevronRight, FolderPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { APIV3Dictionary } from '@/api/v3/Api3Dicts';
import Loader from '@/components/Loader';

interface Category {
  id: string;
  name: string;
  description?: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  subcategoryId: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
}

interface NewItem {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  action: string;
}

const PermissionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<NewItem>({
    name: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    action: ''
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const categoriesRes = await fetch(`${APIV3Dictionary.permission}/category`);
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        
        const subcategoriesRes = await fetch(`${APIV3Dictionary.permission}/subcategory`);
        const subcategoriesData = await subcategoriesRes.json();
        setSubcategories(subcategoriesData);
        
        const permissionsRes = await fetch(`${APIV3Dictionary.permission}/permissions`);
        const permissionsData = await permissionsRes.json();
        setPermissions(permissionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  // Create category
  const createCategory = async () => {
    try {
      const response = await fetch(`${APIV3Dictionary.permission}/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description
        })
      });
      
      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        setNewItem({ name: '', description: '', categoryId: '', subcategoryId: '', action: '' });
        setEditMode(null);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  // Create subcategory
  const createSubcategory = async () => {
    try {
      const response = await fetch(`${APIV3Dictionary.permission}/subcategory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description,
          categoryId: newItem.categoryId
        })
      });
      
      if (response.ok) {
        const newSubcategory = await response.json();
        setSubcategories(prev => [...prev, newSubcategory]);
        setNewItem({ name: '', description: '', categoryId: '', subcategoryId: '', action: '' });
        setEditMode(null);
      }
    } catch (error) {
      console.error('Error creating subcategory:', error);
    }
  };

  // Create permission
  const createPermission = async () => {
    try {
      const response = await fetch(`${APIV3Dictionary.permission}/permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description,
          subcategoryId: newItem.subcategoryId,
          action: newItem.action
        })
      });
      
      if (response.ok) {
        const newPermission = await response.json();
        setPermissions(prev => [...prev, newPermission]);
        setNewItem({ name: '', description: '', categoryId: '', subcategoryId: '', action: '' });
        setEditMode(null);
      }
    } catch (error) {
      console.error('Error creating permission:', error);
    }
  };

  // Delete item
  const deleteItem = async (type: 'category' | 'subcategory' | 'permission', id: string) => {
    try {
      const response = await fetch(`${APIV3Dictionary.permission}/${type}/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (type === 'category') {
          setCategories(prev => prev.filter(item => item.id !== id));
        } else if (type === 'subcategory') {
          setSubcategories(prev => prev.filter(item => item.id !== id));
        } else if (type === 'permission') {
          setPermissions(prev => prev.filter(item => item.id !== id));
        }
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  // Render categories tab content
  const renderCategoriesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Permission Categories</h3>
        <Button size="sm" onClick={() => setEditMode('category')}>
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>
      
      {editMode === 'category' && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newItem.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newItem.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setEditMode(null)}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={createCategory}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No categories found. Create one to get started.</div>
      ) : (
        <div className="space-y-4">
          {categories.map(category => (
            <Card key={category?.id || 'temp'}>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">{category?.name || 'Unnamed Category'}</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteItem('category', category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category?.description && (
                  <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setNewItem(prev => ({ ...prev, categoryId: category.id }));
                    setEditMode('subcategory');
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-1" /> Add Subcategory
                </Button>
                
                {category?.subcategories && category.subcategories.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                    {category.subcategories.map(subcategory => (
                      <div key={subcategory?.id || 'temp'} className="pl-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <ChevronRight className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="font-medium text-sm">{subcategory.name}</span>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteItem('subcategory', subcategory.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {subcategory.description && (
                          <p className="text-xs text-gray-500 ml-5 mt-1">{subcategory.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render subcategories tab content
  const renderSubcategoriesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Subcategories</h3>
        <Button size="sm" onClick={() => setEditMode('subcategory')}>
          <Plus className="h-4 w-4 mr-2" /> Add Subcategory
        </Button>
      </div>
      
      {editMode === 'subcategory' && (
        <Card className="mb-4 border ">
          <CardContent className="pt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              name="categoryId"
              value={newItem.categoryId}
              onValueChange={(value) => handleInputChange({
                target: { name: 'categoryId', value }
              } as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              </div>
              <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={newItem.name}
              onChange={handleInputChange}
            />
              </div>
              <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={newItem.description}
              onChange={handleInputChange}
            />
              </div>
              <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => setEditMode(null)}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={createSubcategory}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {subcategories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No subcategories found. Create one to get started.</div>
      ) : (
        <div className="space-y-4">
          {subcategories.map(subcategory => (
            <Card key={subcategory.id}>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    {subcategory.name}
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {categories.find(c => c.id === subcategory.categoryId)?.name}
                    </span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteItem('subcategory', subcategory.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subcategory.description && (
                  <p className="text-sm text-gray-500 mb-3">{subcategory.description}</p>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setNewItem(prev => ({ ...prev, subcategoryId: subcategory.id }));
                    setEditMode('permission');
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Permission
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render permissions tab content
  const renderPermissionsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Permissions</h3>
        <Button size="sm" onClick={() => setEditMode('permission')}>
          <Plus className="h-4 w-4 mr-2" /> Add Permission
        </Button>
      </div>
      
      {editMode === 'permission' && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="subcategoryId">Subcategory</Label>
                <Select
                  name="subcategoryId"
                  value={newItem.subcategoryId}
                  onValueChange={(value) => handleInputChange({
                    target: { name: 'subcategoryId', value }
                  } as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map(subcategory => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name} ({categories.find(c => c.id === subcategory.categoryId)?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newItem.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  name="action"
                  value={newItem.action}
                  onValueChange={(value) => handleInputChange({
                    target: { name: 'action', value }
                  } as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="READ">Read</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newItem.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setEditMode(null)}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={createPermission}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {permissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No permissions found. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissions.map(permission => {
            const subcategory = subcategories.find(s => s.id === permission?.subcategoryId);
            const category = categories.find(c => c.id === subcategory?.categoryId);
            
            return (
              <Card key={permission?.id || 'temp'}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base">{permission?.name || 'Unnamed Permission'}</CardTitle>
                      <div className="flex mt-1 space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {category?.name || 'No Category'}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {subcategory?.name || 'No Subcategory'}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {permission?.action || 'No Action'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteItem('permission', permission.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {permission.description && (
                    <p className="text-sm text-gray-500">{permission.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <Loader/>;
  }

  return (
    <div className="container  py-8  overflow-y-scroll h-full w-full">
      <h1 className="text-2xl font-bold mb-6">Permission Management System</h1>
      <p className="text-gray-600 mb-6">
        Organize permissions into categories and subcategories to simplify role assignment and management.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="mt-6">
          {renderCategoriesTab()}
        </TabsContent>
        
        <TabsContent value="subcategories" className="mt-6">
          {renderSubcategoriesTab()}
        </TabsContent>
        
        <TabsContent value="permissions" className="mt-6">
          {renderPermissionsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermissionManagement;