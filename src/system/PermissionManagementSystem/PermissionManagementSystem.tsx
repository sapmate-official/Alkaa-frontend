import { APIV3Dictionary } from '@/api/v3/Api3Dicts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Permission, PermissionCategory, PermissionSubcategory } from '@/interface/general'
import axios from 'axios'
import  { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

const PermissionManagementSystem = () => {
  const [categories, setCategories] = useState<PermissionCategory[]>([])
  const [subcategories, setSubcategories] = useState<PermissionSubcategory[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedCategory, setSelectedCategory] = useState<PermissionCategory | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<PermissionSubcategory | null>(null)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
    fetchPermissions()
  }, [])

  // fetch categories
  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${APIV3Dictionary.permission}/categories`, {
        withCredentials: true
      })
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  // fetch subcategories
  const fetchSubcategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${APIV3Dictionary.permission}/subcategories`, {
        withCredentials: true
      })
      setSubcategories(response.data)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      setError('Failed to fetch subcategories')
    } finally {
      setLoading(false)
    }
  }

  // fetch permissions
  const fetchPermissions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${APIV3Dictionary.permission}/permissions`, {
        withCredentials: true
      })
      setPermissions(response.data)
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setError('Failed to fetch permissions')
    } finally {
      setLoading(false)
    }
  }

  // create category
  const createCategory = async (data: { name: string, description?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${APIV3Dictionary.permission}/category`, data, {
        withCredentials: true
      })
      setCategories([...categories, response.data])
      return response.data
    } catch (error) {
      console.error('Error creating category:', error)
      setError('Failed to create category')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // edit category
  const updateCategory = async (id: string, data: { name?: string, description?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.put(`${APIV3Dictionary.permission}/category/${id}`, data, {
        withCredentials: true
      })
      setCategories(categories.map(cat => cat.id === id ? response.data : cat))
      return response.data
    } catch (error) {
      console.error('Error updating category:', error)
      setError('Failed to update category')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // delete category
  const deleteCategory = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await axios.delete(`${APIV3Dictionary.permission}/category/${id}`, {
        withCredentials: true
      })
      setCategories(categories.filter(cat => cat.id !== id))
    } catch (error) {
      console.error('Error deleting category:', error)
      setError('Failed to delete category')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // create subcategory
  const createSubcategory = async (data: { categoryId: string, name: string, description?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${APIV3Dictionary.permission}/subcategory`, data, {
        withCredentials: true
      })
      setSubcategories([...subcategories, response.data])
      return response.data
    } catch (error) {
      console.error('Error creating subcategory:', error)
      setError('Failed to create subcategory')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // edit subcategory
  const updateSubcategory = async (id: string, data: { name?: string, description?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.put(`${APIV3Dictionary.permission}/subcategory/${id}`, data, {
        withCredentials: true
      })
      setSubcategories(subcategories.map(sub => sub.id === id ? response.data : sub))
      return response.data
    } catch (error) {
      console.error('Error updating subcategory:', error)
      setError('Failed to update subcategory')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // delete subcategory
  const deleteSubcategory = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await axios.delete(`${APIV3Dictionary.permission}/subcategory/${id}`, {
        withCredentials: true
      })
      setSubcategories(subcategories.filter(sub => sub.id !== id))
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      setError('Failed to delete subcategory')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // create permission
  const createPermission = async (data: { name: string, subcategoryId: string, action: string, description?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${APIV3Dictionary.permission}/permission`, data, {
        withCredentials: true
      })
      setPermissions([...permissions, response.data])
      return response.data
    } catch (error) {
      console.error('Error creating permission:', error)
      setError('Failed to create permission')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // edit permission
  const updatePermission = async (id: string, data: { name?: string, subcategoryId?: string, action?: string, description?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.put(`${APIV3Dictionary.permission}/permission/${id}`, data, {
        withCredentials: true
      })
      setPermissions(permissions.map(perm => perm.id === id ? response.data : perm))
      return response.data
    } catch (error) {
      console.error('Error updating permission:', error)
      setError('Failed to update permission')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // delete permission
  const deletePermission = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await axios.delete(`${APIV3Dictionary.permission}/permission/${id}`, {
        withCredentials: true
      })
      setPermissions(permissions.filter(perm => perm.id !== id))
    } catch (error) {
      console.error('Error deleting permission:', error)
      setError('Failed to delete permission')
      throw error
    } finally {
      setLoading(false)
    }
  }

  //render category tab
  const categoryTab = () => {
    return(
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Permission Categories</h2>
          <Button 
            variant="default" 
            onClick={() => setEditMode('categoryCreate')}
          >
            Add New Category
          </Button>
        </div>

        {
          editMode === 'categoryCreate' && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Create New Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input id="categoryName" value={selectedCategory?.name || ''} onChange={e => setSelectedCategory({...selectedCategory, name: e.target.value} as PermissionCategory)} />
                </div>
                <div>
                  <Label htmlFor="categoryDesc">Description</Label>
                  <Input id="categoryDesc" value={selectedCategory?.description || ''} onChange={e => setSelectedCategory({...selectedCategory, description: e.target.value} as PermissionCategory)} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-start space-x-2">
                <Button 
                  variant="default"
                  onClick={() => {
                    if (selectedCategory?.name) {
                      createCategory({ name: selectedCategory.name, description: selectedCategory.description })
                        .then(() => {
                          setSelectedCategory(null);
                          setEditMode(null);
                        });
                    }
                  }}
                >
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setEditMode(null);
                  }}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          )
        }
        
        {
          editMode === 'categoryEdit' && selectedCategory && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Edit Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="editCategoryName">Category Name</Label>
                  <Input id="editCategoryName" value={selectedCategory.name} onChange={e => setSelectedCategory({...selectedCategory, name: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="editCategoryDesc">Description</Label>
                  <Input id="editCategoryDesc" value={selectedCategory.description} onChange={e => setSelectedCategory({...selectedCategory, description: e.target.value})} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-start space-x-2">
                <Button 
                  variant="default"
                  onClick={() => updateCategory(selectedCategory.id, {name: selectedCategory.name, description: selectedCategory.description})
                    .then(() => setEditMode(null))}
                >
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditMode(null)}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          )
        }

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-4">Loading categories...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-600">{error}</div>
          ) : (
            <div className="border rounded-md divide-y">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No categories found</div>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description || 'No description'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedCategory(category);
                          setEditMode('categoryEdit');
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${category.name}?`)) {
                            deleteCategory(category.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  //render subcategory tab
  const subcategoryTab = () => {
    return(
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Permission Subcategories</h2>
          <Button 
            variant="default"
            onClick={() => setEditMode('subcategoryCreate')}
          >
            Add New Subcategory
          </Button>
        </div>

        {
          editMode === 'subcategoryCreate' && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Create New Subcategory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="categorySelect">Parent Category</Label>
                  <Select 
                    value={selectedSubcategory?.categoryId || ''}
                    onValueChange={(value) => setSelectedSubcategory({...selectedSubcategory, categoryId: value} as PermissionSubcategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subcategoryName">Subcategory Name</Label>
                  <Input 
                    id="subcategoryName" 
                    value={selectedSubcategory?.name || ''} 
                    onChange={e => setSelectedSubcategory({...selectedSubcategory, name: e.target.value} as PermissionSubcategory)} 
                  />
                </div>
                <div>
                  <Label htmlFor="subcategoryDesc">Description</Label>
                  <Input 
                    id="subcategoryDesc" 
                    value={selectedSubcategory?.description || ''} 
                    onChange={e => setSelectedSubcategory({...selectedSubcategory, description: e.target.value} as PermissionSubcategory)} 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-start space-x-2">
                <Button 
                  variant="default"
                  onClick={() => {
                    if (selectedSubcategory?.name && selectedSubcategory?.categoryId) {
                      createSubcategory({
                        categoryId: selectedSubcategory.categoryId,
                        name: selectedSubcategory.name,
                        description: selectedSubcategory.description
                      }).then(() => {
                        setSelectedSubcategory(null);
                        setEditMode(null);
                      });
                    }
                  }}
                >
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedSubcategory(null);
                    setEditMode(null);
                  }}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          )
        }
        
        {
          editMode === 'subcategoryEdit' && selectedSubcategory && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Edit Subcategory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="editSubcategoryName">Subcategory Name</Label>
                  <Input 
                    id="editSubcategoryName" 
                    value={selectedSubcategory.name} 
                    onChange={e => setSelectedSubcategory({...selectedSubcategory, name: e.target.value})} 
                  />
                </div>
                <div>
                  <Label htmlFor="editSubcategoryDesc">Description</Label>
                  <Input 
                    id="editSubcategoryDesc" 
                    value={selectedSubcategory.description} 
                    onChange={e => setSelectedSubcategory({...selectedSubcategory, description: e.target.value})} 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-start space-x-2">
                <Button 
                  variant="default"
                  onClick={() => updateSubcategory(selectedSubcategory.id, {
                    name: selectedSubcategory.name, 
                    description: selectedSubcategory.description
                  }).then(() => setEditMode(null))}
                >
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditMode(null)}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          )
        }

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-4">Loading subcategories...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-600">{error}</div>
          ) : (
            <div className="border rounded-md divide-y">
              {subcategories.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No subcategories found</div>
              ) : (
                subcategories.map((subcategory) => {
                  const category = categories.find(cat => cat.id === subcategory.categoryId);
                  return (
                    <div key={subcategory.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 flex items-center pb-2"><Badge>{category?.name || 'Unknown'}</Badge></div>
                        <h3 className="font-medium">{subcategory.name}</h3>
                        <p className="text-sm text-gray-600">{subcategory.description || 'No description'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedSubcategory(subcategory);
                            setEditMode('subcategoryEdit');
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${subcategory.name}?`)) {
                              deleteSubcategory(subcategory.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  //render permission tab
  const permissionTab = () => {
    return(
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Permissions</h2>
          <Button 
            variant="default"
            onClick={() => setEditMode('permissionCreate')}
          >
            Add New Permission
          </Button>
        </div>

        {
          editMode === 'permissionCreate' && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Create New Permission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="subcatSelect">Subcategory</Label>
                  <Select 
                    value={selectedPermission?.subcategoryId || ''}
                    onValueChange={(value) => setSelectedPermission({...selectedPermission, subcategoryId: value} as Permission)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {subcategories.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.category.name} -- {sub.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="permissionName">Permission Name</Label>
                  <Input 
                    id="permissionName" 
                    value={selectedPermission?.name || ''} 
                    onChange={e => setSelectedPermission({...selectedPermission, name: e.target.value} as Permission)} 
                  />
                </div>
                <div>
                  <Label htmlFor="permissionAction">Action</Label>
                  <Input 
                    id="permissionAction" 
                    value={selectedPermission?.action || ''} 
                    onChange={e => setSelectedPermission({...selectedPermission, action: e.target.value} as Permission)} 
                  />
                </div>
                <div>
                  <Label htmlFor="permissionDesc">Description</Label>
                  <Input 
                    id="permissionDesc" 
                    value={selectedPermission?.description || ''} 
                    onChange={e => setSelectedPermission({...selectedPermission, description: e.target.value} as Permission)} 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-start space-x-2">
                <Button 
                  variant="default"
                  onClick={() => {
                    if (selectedPermission?.name && selectedPermission?.subcategoryId && selectedPermission?.action) {
                      createPermission({
                        name: selectedPermission.name,
                        subcategoryId: selectedPermission.subcategoryId,
                        action: selectedPermission.action,
                        description: selectedPermission.description
                      }).then(() => {
                        setSelectedPermission(null);
                        setEditMode(null);
                      });
                    }
                  }}
                >
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedPermission(null);
                    setEditMode(null);
                  }}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          )
        }
        
        {
          editMode === 'permissionEdit' && selectedPermission && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Edit Permission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="editSubcatSelect">Subcategory</Label>
                  <Select 
                    value={selectedPermission.subcategoryId}
                    onValueChange={(value) => setSelectedPermission({...selectedPermission, subcategoryId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {subcategories.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{`${sub.name} • ${sub?.category?.name}`}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editPermissionName">Permission Name</Label>
                  <Input 
                    id="editPermissionName" 
                    value={selectedPermission.name} 
                    onChange={e => setSelectedPermission({...selectedPermission, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editPermissionAction">Action</Label>
                  <Input 
                    id="editPermissionAction" 
                    value={selectedPermission.action} 
                    onChange={e => setSelectedPermission({...selectedPermission, action: e.target.value})} 
                  />
                </div>
                <div>
                  <Label htmlFor="editPermissionDesc">Description</Label>
                  <Input 
                    id="editPermissionDesc" 
                    value={selectedPermission.description} 
                    onChange={e => setSelectedPermission({...selectedPermission, description: e.target.value})} 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-start space-x-2">
                <Button 
                  variant="default"
                  onClick={() => updatePermission(selectedPermission.id, {
                    name: selectedPermission.name,
                    subcategoryId: selectedPermission.subcategoryId,
                    action: selectedPermission.action,
                    description: selectedPermission.description
                  }).then(() => setEditMode(null))}
                >
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditMode(null)}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          )
        }

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-4">Loading permissions...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-600">{error}</div>
          ) : (
            <div className="border rounded-md divide-y">
              {permissions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No permissions found</div>
              ) : (
                permissions.map((permission) => {
                  const subcategory = subcategories.find(sub => sub.id === permission.subcategoryId);
                  return (
                    <div key={permission.id} className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{permission.name}</h3>
                        <p className="text-sm text-gray-600">{permission.description || 'No description'}</p>
                        <p className="text-xs text-gray-500">
                          Action: <span className="font-mono">{permission.action}</span> | 
                          Subcategory: {subcategory?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedPermission(permission);
                            setEditMode('permissionEdit');
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${permission.name}?`)) {
                              deletePermission(permission.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col w-full h-full overflow-y-scroll'>
      <div className='justify-center w-full h-full p-4'>
        <h1 className='text-2xl font-bold'>Permission Management System</h1>

        <Tabs defaultValue='category' className='mt-4 w-full h-full'>
          <TabsList>
            <TabsTrigger value='category'>Category</TabsTrigger>
            <TabsTrigger value='subcategory'>Sub-Category</TabsTrigger>
            <TabsTrigger value='permission'>Permission</TabsTrigger>
          </TabsList>
          <TabsContent value='category'>
            {categoryTab()}
          </TabsContent>
          <TabsContent value='subcategory'>
            {subcategoryTab()}
          </TabsContent>
          <TabsContent value='permission'>
            {permissionTab()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default PermissionManagementSystem