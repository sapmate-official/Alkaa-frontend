import { useState } from 'react';
import { Holiday, HolidayType } from '../types/holiday.types';
import { getHolidayTypeColor } from '../utils/holiday.utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AdminViewProps {
  holidays: Holiday[];
  holidayTypes: HolidayType[];
  orgId: string;
  onAddHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  onDeleteHoliday: (id: string) => void;
  onAddHolidayType: (holidayType: Omit<HolidayType, 'id'>) => void;
  onUpdateHolidayType: (id: string, holidayType: Partial<HolidayType>) => void;
  onDeleteHolidayType: (id: string) => void;
}

export const AdminView = ({ 
  holidays, 
  holidayTypes, 
  orgId, 
  onAddHoliday, 
  onDeleteHoliday,
  onAddHolidayType,
  onUpdateHolidayType,
  onDeleteHolidayType
}: AdminViewProps) => {
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    type: '',
    description: '',
    isOptional: false,
    orgId: orgId
  });

  const [newHolidayType, setNewHolidayType] = useState({
    name: '',
    policy: '',
    orgId: orgId
  });

  const [editingHolidayType, setEditingHolidayType] = useState<string | null>(null);
  const [showHolidayTypes, setShowHolidayTypes] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewHoliday({
      ...newHoliday,
      [name]: value
    });
  };

  const handleSelectChange = (value: string) => {
    setNewHoliday({
      ...newHoliday,
      type: value
    });
  };

  const handleHolidayTypeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewHolidayType({
      ...newHolidayType,
      [name]: value
    });
  };



  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAddHoliday(newHoliday);
    setNewHoliday({
      name: '',
      date: '',
      type: '',
      description: '',
      isOptional: false,
      orgId: orgId
    });
  };

  const handleHolidayTypeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (editingHolidayType) {
      onUpdateHolidayType(editingHolidayType, {
        name: newHolidayType.name,
        policy: newHolidayType.policy
      });
      setEditingHolidayType(null);
    } else {
      onAddHolidayType(newHolidayType);
    }
    
    setNewHolidayType({
      name: '',
      policy: '',
      orgId: orgId
    });
  };

  const handleEditHolidayType = (holidayType: HolidayType) => {
    setEditingHolidayType(holidayType.id);
    setNewHolidayType({
      name: holidayType.name,
      policy: holidayType.policy || '',
      orgId: orgId
    });
  };

  const handleCancelEdit = () => {
    setEditingHolidayType(null);
    setNewHolidayType({
      name: '',
      policy: '',
      orgId: orgId
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Company Holidays</h2>
      
      <div className="mb-6 flex gap-4">
        <Button 
          variant={!showHolidayTypes ? "default" : "outline"}
          onClick={() => setShowHolidayTypes(false)}
        >
          Manage Holidays
        </Button>
        <Button 
          variant={showHolidayTypes ? "default" : "outline"}
          onClick={() => setShowHolidayTypes(true)}
        >
          Manage Holiday Types
        </Button>
      </div>
      
      {!showHolidayTypes ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Holiday</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="holiday-name">Holiday Name</Label>
                    <Input 
                      id="holiday-name"
                      type="text" 
                      name="name"
                      value={newHoliday.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holiday-date">Date</Label>
                    <Input 
                      id="holiday-date"
                      type="date" 
                      name="date"
                      value={newHoliday.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="holiday-type">Type</Label>
                    <Select
                      name="type"
                      value={newHoliday.type}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a holiday type" />
                      </SelectTrigger>
                      <SelectContent>
                        {holidayTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center h-full pt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isOptional"
                        checked={newHoliday.isOptional}
                        onCheckedChange={(checked) => 
                          setNewHoliday({...newHoliday, isOptional: checked === true})
                        }
                      />
                      <Label htmlFor="isOptional">
                        Optional Holiday (Office Open)
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="holiday-description">Description (Optional)</Label>
                  <Textarea
                    id="holiday-description"
                    name="description"
                    value={newHoliday.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">
                    Add Holiday
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">Current Holidays</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map(holiday => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">{holiday.name}</TableCell>
                    <TableCell>{formatDate(holiday.date)}</TableCell>
                    <TableCell>
                      <Badge className={getHolidayTypeColor(holiday.holidayType?.name || 'Default')}>
                        {holiday.holidayType?.name || 'Default'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {holiday.isOptional ? "Optional" : "Office Closed"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => onDeleteHoliday(holiday.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingHolidayType ? 'Edit Holiday Type' : 'Add New Holiday Type'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHolidayTypeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type-name">Type Name</Label>
                  <Input 
                    id="type-name"
                    type="text" 
                    name="name"
                    value={newHolidayType.name}
                    onChange={handleHolidayTypeInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type-policy">Policy (Optional)</Label>
                  <Textarea
                    id="type-policy"
                    name="policy"
                    value={newHolidayType.policy}
                    onChange={handleHolidayTypeInputChange}
                    rows={3}
                    placeholder="Describe the policy for this holiday type..."
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  {editingHolidayType && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit">
                    {editingHolidayType ? 'Update Type' : 'Add Type'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">Holiday Types</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidayTypes.map(type => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <Badge className={getHolidayTypeColor(type.name)}>
                        {type.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {type.policy || 'No policy defined'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditHolidayType(type)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => onDeleteHolidayType(type.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
