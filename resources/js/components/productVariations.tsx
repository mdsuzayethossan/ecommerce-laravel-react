import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, X, RefreshCw, Image as ImageIcon, 
  Trash2, Check, Save, AlertCircle 
} from 'lucide-react';

type AttributeValue = {
  id: number;
  value: string;
  selected: boolean;
};

type AttributeType = {
  id: number;
  name: string;
  selected: boolean;
  values: AttributeValue[];
};

type VariationCombination = {
  attribute_id: number;
  attribute_name: string;
  value_id: number;
  value: string;
};

type VariationType = {
  id?: number;
  temp_id?: string;
  combination: VariationCombination[];
  price: string | number;
  sale_price: string | number | null;
  stock_quantity: string | number;
  sku: string;
  image: File | null | string;
};

type ProductVariationsProps = {
  productData: any;
  updateProductData: (data: any) => void;
  attributes: any[];
  isEditing?: boolean;
};

export default function ProductVariations({ 
  productData, 
  updateProductData, 
  attributes,
  isEditing = false
}: ProductVariationsProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<AttributeType[]>([]);
  const [showAddVariationDialog, setShowAddVariationDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [newVariation, setNewVariation] = useState<VariationType | null>(null);
  const [bulkEditData, setBulkEditData] = useState({
    price: '',
    sale_price: '',
    stock_quantity: '',
  });
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  
  // Initialize selected attributes from existing data if editing
  useEffect(() => {
    if (attributes?.length) {
      // Map attributes with selection state
      const mappedAttributes = attributes.map(attr => {
        // When editing, check if attribute is used in variations
        const attrSelected = isEditing && productData.variations?.some(
          (v: any) => v.combination?.some((c: any) => c.attribute_id === attr.id)
        );
        
        return {
          ...attr,
          selected: attrSelected || false,
          values: attr.values.map((v: any) => {
            // When editing, check if this value is used in variations
            const valueSelected = isEditing && productData.variations?.some(
              (var1: any) => var1.combination?.some(
                (c: any) => c.value_id === v.id
              )
            );
            
            return { 
              ...v, 
              selected: valueSelected || false 
            };
          })
        };
      });
      
      setSelectedAttributes(mappedAttributes);
    }
  }, [attributes, isEditing, productData.variations]); 

  const handleAttributeToggle = (attrIndex: number) => {
    const updatedAttributes = [...selectedAttributes];
    updatedAttributes[attrIndex].selected = !updatedAttributes[attrIndex].selected;
    
    // If deselecting an attribute, deselect all its values too
    if (!updatedAttributes[attrIndex].selected) {
      updatedAttributes[attrIndex].values = updatedAttributes[attrIndex].values.map(v => ({
        ...v,
        selected: false
      }));
    }
    
    setSelectedAttributes(updatedAttributes);
  };
  
  const handleValueToggle = (attrIndex: number, valueIndex: number) => {
    const updatedAttributes = [...selectedAttributes];
    updatedAttributes[attrIndex].values[valueIndex].selected = 
      !updatedAttributes[attrIndex].values[valueIndex].selected;
    setSelectedAttributes(updatedAttributes);
  };
  
  const generateVariations = () => {
    // Skip if no attributes selected
    if (!selectedAttributes.some(attr => attr.selected && attr.values.some(v => v.selected))) {
      toast({
        title: "No attributes selected",
        description: "Please select at least one attribute and value to generate variations.",
        variant: "destructive"
      });
      return;
    }
    
    // Get all selected attributes and their selected values
    const attributeValues = selectedAttributes
      .filter(attr => attr.selected)
      .map(attr => 
        attr.values
          .filter(v => v.selected)
          .map(v => ({
            attribute_id: attr.id,
            attribute_name: attr.name,
            value_id: v.id,
            value: v.value
          }))
      )
      .filter(values => values.length > 0); // Only include attributes with selected values
    
    if (attributeValues.length === 0) {
      toast({
        title: "No values selected",
        description: "Please select at least one value for each selected attribute.",
        variant: "destructive"
      });
      return;
    }
    
    // Generate all possible combinations (Cartesian product)
    const generateCombinations = (arrays: VariationCombination[][], current: VariationCombination[] = [], index = 0): VariationCombination[][] => {
      if (index === arrays.length) {
        return [current];
      }
      
      let all: VariationCombination[][] = [];
      for (let i = 0; i < arrays[index].length; i++) {
        all = all.concat(
          generateCombinations(arrays, [...current, arrays[index][i]], index + 1)
        );
      }
      return all;
    };
    
    const combinations = generateCombinations(attributeValues);
    
    // Create variation objects with default values
    const variations: VariationType[] = combinations.map((combo, index) => {
      // Create a unique SKU based on parent + attribute values
      const skuSuffix = combo.map(c => c.value.substring(0, 3).toUpperCase()).join('-');
      const basePrice = productData.price ? parseFloat(productData.price) : 0;
      
      return {
        temp_id: `temp-${Date.now()}-${index}`,
        combination: combo,
        price: basePrice,
        sale_price: productData.sale_price || null,
        stock_quantity: productData.stock_quantity || 0,
        sku: `${productData.sku || 'SKU'}-${skuSuffix}`,
        image: null
      };
    });
    
    // If we already have variations, merge with existing ones
    // but avoid duplicates based on the exact same attribute combination
    if (productData.variations && productData.variations.length > 0) {
      // Create a map of existing combinations for easy lookup
      const existingCombos = new Map();
      
      productData.variations.forEach((variant: VariationType) => {
        // Create a key from the combination (sorted to ensure consistent comparison)
        const comboKey = variant.combination
          .map(c => `${c.attribute_id}-${c.value_id}`)
          .sort()
          .join('|');
        
        existingCombos.set(comboKey, variant);
      });
      
      // Check each new variation against existing ones
      const newVariations = variations.filter(newVar => {
        const newComboKey = newVar.combination
          .map(c => `${c.attribute_id}-${c.value_id}`)
          .sort()
          .join('|');
        
        return !existingCombos.has(newComboKey);
      });
      
      // Merge with existing variations
      updateProductData({ 
        variations: [...productData.variations, ...newVariations] 
      });
      
      toast({
        title: `Added ${newVariations.length} new variations`,
        description: `${newVariations.length} new variations were added. ${variations.length - newVariations.length} were skipped because they already exist.`,
      });
    } else {
      // No existing variations, just set these
      updateProductData({ variations });
      
      toast({
        title: `Generated ${variations.length} variations`,
        description: "All variations have been generated successfully.",
      });
    }
  };
  
  const handleRegenerateVariations = () => {
    // Clear all existing variations and generate new ones
    updateProductData({ variations: [] });
    generateVariations();
    setConfirmRegenerate(false);
  };
  
  const updateVariation = (index: number, field: string, value: any) => {
    const updatedVariations = [...(productData.variations || [])];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value
    };
    updateProductData({ variations: updatedVariations });
  };
  
  const removeVariation = (index: number) => {
    const updatedVariations = [...(productData.variations || [])];
    updatedVariations.splice(index, 1);
    updateProductData({ variations: updatedVariations });
  };
  
  const handleBulkEdit = () => {
    const { price, sale_price, stock_quantity } = bulkEditData;
    
    const updatedVariations = (productData.variations || []).map(variant => {
      const updatedVariant = { ...variant };
      
      if (price !== '') updatedVariant.price = price;
      if (sale_price !== '') updatedVariant.sale_price = sale_price;
      if (stock_quantity !== '') updatedVariant.stock_quantity = stock_quantity;
      
      return updatedVariant;
    });
    
    updateProductData({ variations: updatedVariations });
    setShowBulkEditDialog(false);
    setBulkEditData({ price: '', sale_price: '', stock_quantity: '' });
    
    toast({
        title: "Bulk update successful",
        description: `Updated ${updatedVariations.length} variations successfully.`,
      });
    };
    
    const handleAddVariation = () => {
      if (!newVariation) return;
      
      // Validate the new variation
      if (!newVariation.sku || !newVariation.price) {
        toast({
          title: "Validation error",
          description: "SKU and price are required for all variations.",
          variant: "destructive"
        });
        return;
      }
      
      // Check for duplicate SKU
      const isDuplicateSku = (productData.variations || []).some(
        (v: any) => v.sku === newVariation.sku
      );
      
      if (isDuplicateSku) {
        toast({
          title: "Duplicate SKU",
          description: "This SKU already exists. Please use a unique SKU.",
          variant: "destructive"
        });
        return;
      }
      
      // Add the new variation
      const updatedVariations = [
        ...(productData.variations || []),
        {
          ...newVariation,
          temp_id: `temp-${Date.now()}`
        }
      ];
      
      updateProductData({ variations: updatedVariations });
      setShowAddVariationDialog(false);
      setNewVariation(null);
      
      toast({
        title: "Variation added",
        description: "New variation has been added successfully.",
      });
    };
    
    const prepareNewVariation = () => {
      // Create a skeleton variation with one value from each selected attribute
      const selectedAttrs = selectedAttributes.filter(attr => attr.selected);
      
      if (selectedAttrs.length === 0) {
        toast({
          title: "No attributes selected",
          description: "Please select at least one attribute before adding a manual variation.",
          variant: "destructive"
        });
        return;
      }
      
      const combination = selectedAttrs.map(attr => {
        // Get the first selected value, or just the first value if none selected
        const value = attr.values.find(v => v.selected) || attr.values[0];
        
        return {
          attribute_id: attr.id,
          attribute_name: attr.name,
          value_id: value.id,
          value: value.value
        };
      });
      
      // Create a SKU suffix from the values
      const skuSuffix = combination.map(c => c.value.substring(0, 3).toUpperCase()).join('-');
      
      setNewVariation({
        combination,
        price: productData.price || 0,
        sale_price: productData.sale_price || null,
        stock_quantity: productData.stock_quantity || 0,
        sku: `${productData.sku || 'SKU'}-${skuSuffix}`,
        image: null
      });
      
      setShowAddVariationDialog(true);
    };
    
    const updateNewVariationAttribute = (attrIndex: number, valueId: number) => {
      if (!newVariation) return;
      
      // Find the attribute in the selected attributes
      const attribute = selectedAttributes.find(
        attr => attr.id === newVariation.combination[attrIndex].attribute_id
      );
      
      if (!attribute) return;
      
      // Find the value in that attribute
      const value = attribute.values.find(v => v.id === valueId);
      
      if (!value) return;
      
      // Update the combination
      const updatedCombination = [...newVariation.combination];
      updatedCombination[attrIndex] = {
        ...updatedCombination[attrIndex],
        value_id: value.id,
        value: value.value
      };
      
      setNewVariation({
        ...newVariation,
        combination: updatedCombination
      });
    };
  
    return (
      <div className="space-y-6">
        {/* Attribute Selection Section */}
        <Card>
          <CardHeader>
            <CardTitle>Product Attributes</CardTitle>
            <CardDescription>
              Select attributes and their values to create variations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto p-4 border rounded-md">
              {selectedAttributes.map((attr, attrIndex) => (
                <Card key={attr.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`attr-${attr.id}`}
                          checked={attr.selected}
                          onCheckedChange={() => handleAttributeToggle(attrIndex)}
                        />
                        <Label htmlFor={`attr-${attr.id}`} className="text-base font-medium">
                          {attr.name}
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {attr.selected && (
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {attr.values.map((value, valueIndex) => (
                          <div key={value.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`value-${value.id}`}
                              checked={value.selected}
                              onCheckedChange={() => handleValueToggle(attrIndex, valueIndex)}
                            />
                            <Label htmlFor={`value-${value.id}`}>{value.value}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={prepareNewVariation}
              variant="outline"
              disabled={!selectedAttributes.some(attr => attr.selected)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Variation Manually
            </Button>
            
            {productData.variations?.length > 0 ? (
              <AlertDialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Variations
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all existing variations and create new ones based on the selected attributes and values. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerateVariations}>
                      Yes, regenerate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                onClick={generateVariations}
                disabled={!selectedAttributes.some(attr => attr.selected && attr.values.some(v => v.selected))}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Variations
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Variations Table */}
        {productData.variations?.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Product Variations ({productData.variations.length})</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBulkEditDialog(true)}
                  >
                    Bulk Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variation</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productData.variations.map((variation: VariationType, index: number) => (
                      <TableRow key={variation.id || variation.temp_id}>
                        <TableCell className="font-medium">
                          {variation.combination.map((c, i) => (
                            <div key={i} className="whitespace-nowrap">
                              <span className="font-medium">{c.attribute_name}: </span>
                              <span>{c.value}</span>
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variation.price}
                            onChange={(e) => updateVariation(index, 'price', e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variation.sale_price || ''}
                            onChange={(e) => updateVariation(index, 'sale_price', e.target.value || null)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={variation.sku}
                            onChange={(e) => updateVariation(index, 'sku', e.target.value)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={variation.stock_quantity}
                            onChange={(e) => updateVariation(index, 'stock_quantity', e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {variation.image && typeof variation.image === 'string' ? (
                              <div className="relative w-10 h-10 mr-2">
                                <img 
                                  src={variation.image.startsWith('http') 
                                    ? variation.image 
                                    : URL.createObjectURL(variation.image as File)
                                  }
                                  alt="Variation" 
                                  className="rounded object-cover w-10 h-10"
                                />
                              </div>
                            ) : null}
                            
                            <label htmlFor={`variation-image-${index}`} className="cursor-pointer">
                              <div className="flex items-center">
                                <Button variant="outline" size="sm" type="button" className="p-1 h-8">
                                  <ImageIcon className="h-4 w-4" />
                                  <span className="sr-only">Choose Image</span>
                                </Button>
                              </div>
                              <input
                                id={`variation-image-${index}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    updateVariation(index, 'image', e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVariation(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Add Variation Dialog */}
        <Dialog open={showAddVariationDialog} onOpenChange={setShowAddVariationDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Variation</DialogTitle>
              <DialogDescription>
                Create a custom variation with specific attribute values.
              </DialogDescription>
            </DialogHeader>
            
            {newVariation && (
              <div className="space-y-4 py-4">
                {/* Attribute Selection */}
                <div className="space-y-4">
                  {newVariation.combination.map((combo, index) => (
                    <div key={index} className="grid grid-cols-4 items-center gap-4">
                      <Label className="col-span-1">{combo.attribute_name}</Label>
                      <div className="col-span-3">
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={combo.value_id}
                          onChange={(e) => updateNewVariationAttribute(index, parseInt(e.target.value))}
                        >
                          {selectedAttributes
                            .find(attr => attr.id === combo.attribute_id)
                            ?.values.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.value}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Variation Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="variation-price">Price</Label>
                    <Input
                      id="variation-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newVariation.price}
                      onChange={(e) => setNewVariation({
                        ...newVariation,
                        price: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="variation-sale-price">Sale Price</Label>
                    <Input
                      id="variation-sale-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newVariation.sale_price || ''}
                      onChange={(e) => setNewVariation({
                        ...newVariation,
                        sale_price: e.target.value || null
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="variation-sku">SKU</Label>
                    <Input
                      id="variation-sku"
                      value={newVariation.sku}
                      onChange={(e) => setNewVariation({
                        ...newVariation,
                        sku: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="variation-stock">Stock</Label>
                    <Input
                      id="variation-stock"
                      type="number"
                      min="0"
                      value={newVariation.stock_quantity}
                      onChange={(e) => setNewVariation({
                        ...newVariation,
                        stock_quantity: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Variation Image</Label>
                  <div className="flex items-center space-x-2">
                    {newVariation.image && (
                      <div className="relative w-12 h-12">
                        <img 
                          src={typeof newVariation.image === 'string' 
                            ? newVariation.image 
                            : URL.createObjectURL(newVariation.image as File)
                          }
                          alt="Variation" 
                          className="rounded object-cover w-12 h-12"
                        />
                      </div>
                    )}
                    
                    <label htmlFor="new-variation-image" className="cursor-pointer">
                      <Button variant="outline" type="button">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {newVariation.image ? 'Change Image' : 'Select Image'}
                      </Button>
                      <input
                        id="new-variation-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setNewVariation({
                              ...newVariation,
                              image: e.target.files[0]
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddVariationDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddVariation}>
                <Plus className="mr-2 h-4 w-4" />
                Add Variation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Bulk Edit Dialog */}
        <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Bulk Edit Variations</DialogTitle>
              <DialogDescription>
                Apply changes to all variations at once. Leave a field empty to keep existing values.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-price">Price</Label>
                <Input
                  id="bulk-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave empty to keep current values"
                  value={bulkEditData.price}
                  onChange={(e) => setBulkEditData({
                    ...bulkEditData,
                    price: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bulk-sale-price">Sale Price</Label>
                <Input
                  id="bulk-sale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave empty to keep current values"
                  value={bulkEditData.sale_price}
                  onChange={(e) => setBulkEditData({
                    ...bulkEditData,
                    sale_price: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bulk-stock">Stock Quantity</Label>
                <Input
                  id="bulk-stock"
                  type="number"
                  min="0"
                  placeholder="Leave empty to keep current values"
                  value={bulkEditData.stock_quantity}
                  onChange={(e) => setBulkEditData({
                    ...bulkEditData,
                    stock_quantity: e.target.value
                  })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowBulkEditDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleBulkEdit}>
                Apply to All Variations
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }