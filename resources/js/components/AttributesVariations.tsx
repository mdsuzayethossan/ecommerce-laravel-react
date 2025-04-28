import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash, Image as ImageIcon } from 'lucide-react';

export default function AttributesVariations({ productData, updateProductData, attributes, productType }) {
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [showVariationForm, setShowVariationForm] = useState(false);
  
  // For variable products
  const generateVariations = () => {
    // Skip if no attributes selected
    if (selectedAttributes.length === 0) return;
    
    // Get all combinations of attribute values
    const attributeValues = selectedAttributes.map(attr => 
      attr.values.filter(v => v.selected).map(v => ({
        attribute_id: attr.id,
        attribute_name: attr.name,
        value_id: v.id,
        value: v.value
      }))
    );
    
    // Generate all possible combinations
    const generateCombinations = (arrays, current = [], index = 0) => {
      if (index === arrays.length) {
        return [current];
      }
      
      let all = [];
      for (let i = 0; i < arrays[index].length; i++) {
        all = all.concat(
          generateCombinations(arrays, [...current, arrays[index][i]], index + 1)
        );
      }
      return all;
    };
    
    const combinations = generateCombinations(attributeValues);
    
    // Create variation objects with default values
    const variations = combinations.map((combo, index) => {
      // Create a unique SKU based on parent + attribute values
      const skuSuffix = combo.map(c => c.value.substring(0, 3)).join('-');
      
      return {
        id: `temp-${index}`,
        combination: combo,
        price: productData.price || 0,
        sale_price: productData.sale_price || null,
        stock_quantity: productData.stock_quantity || 0,
        sku: `${productData.sku || 'SKU'}-${skuSuffix}`,
        image: null
      };
    });
    
    updateProductData({ variations });
  };
  
  // Load existing attributes into state
  useEffect(() => {
    if (attributes?.length) {
      const mappedAttributes = attributes.map(attr => ({
        ...attr,
        selected: false,
        values: attr.values.map(v => ({ ...v, selected: false }))
      }));
      setSelectedAttributes(mappedAttributes);
    }
  }, [attributes]);
  
  const handleAttributeToggle = (attrIndex) => {
    const updatedAttributes = [...selectedAttributes];
    updatedAttributes[attrIndex].selected = !updatedAttributes[attrIndex].selected;
    setSelectedAttributes(updatedAttributes);
  };
  
  const handleValueToggle = (attrIndex, valueIndex) => {
    const updatedAttributes = [...selectedAttributes];
    updatedAttributes[attrIndex].values[valueIndex].selected = 
      !updatedAttributes[attrIndex].values[valueIndex].selected;
    setSelectedAttributes(updatedAttributes);
  };
  
  const updateVariation = (index, field, value) => {
    const updatedVariations = [...productData.variations];
    updatedVariations[index][field] = value;
    updateProductData({ variations: updatedVariations });
  };
  
  const renderVariableProductUI = () => (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Select Product Attributes</h3>
        <p className="text-muted-foreground mb-4">
          Choose attributes and values to create variations
        </p>
        
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
        
        <Button 
          onClick={generateVariations} 
          className="mt-4"
          disabled={!selectedAttributes.some(attr => attr.selected && attr.values.some(v => v.selected))}
        >
          Generate Variations
        </Button>
      </div>
      
      {productData.variations && productData.variations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Product Variations</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variation</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Image</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.variations.map((variation, index) => (
                <TableRow key={variation.id || index}>
                  <TableCell>
                    {variation.combination.map(c => `${c.attribute_name}: ${c.value}`).join(', ')}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={variation.price}
                      onChange={(e) => updateVariation(index, 'price', e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={variation.sale_price || ''}
                      onChange={(e) => updateVariation(index, 'sale_price', e.target.value)}
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
                      value={variation.stock_quantity}
                      onChange={(e) => updateVariation(index, 'stock_quantity', e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="w-full">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {variation.image ? 'Change' : 'Add'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowVariationForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Variation Manually
            </Button>
          </div>
        </div>
      )}
    </>
  );
  
  const renderSimpleProductAttributes = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Product Attributes</h3>
      <p className="text-muted-foreground mb-4">
        Add attributes to provide additional product information (optional)
      </p>
      
      {/* Simple list of attributes without variations */}
      {selectedAttributes.map((attr, attrIndex) => (
        <div key={attr.id} className="mb-4 p-4 border rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`simple-attr-${attr.id}`}
                checked={attr.selected}
                onCheckedChange={() => handleAttributeToggle(attrIndex)}
              />
              <Label htmlFor={`simple-attr-${attr.id}`} className="text-base font-medium">
                {attr.name}
              </Label>
            </div>
          </div>
          
          {attr.selected && (
            <div className="mt-4">
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {attr.values.map(value => (
                    <SelectItem key={value.id} value={value.id.toString()}>
                      {value.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
  
  return (
    <div>
      {productType === 'variable' ? renderVariableProductUI() : renderSimpleProductAttributes()}
    </div>
  );
}