import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Package, Packages } from 'lucide-react';

export default function ProductTypeSelector({ productType, setProductType }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Product Type</h3>
      <p className="text-muted-foreground">
        Choose whether this is a simple product or a product with variations
      </p>
      
      <RadioGroup
        value={productType}
        onValueChange={setProductType}
        className="grid grid-cols-2 gap-4 mt-6"
      >
        <div className="relative">
          <RadioGroupItem
            value="simple"
            id="simple"
            className="sr-only"
          />
          <Label
            htmlFor="simple"
            className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-full
              ${productType === 'simple' ? 'border-primary' : ''}
            `}
          >
            <Package className="h-12 w-12 mb-3" />
            <CardTitle className="text-lg">Simple Product</CardTitle>
            <CardDescription className="text-center mt-2">
              A product with a single price, SKU, and inventory level
            </CardDescription>
          </Label>
        </div>

        <div className="relative">
          <RadioGroupItem
            value="variable"
            id="variable"
            className="sr-only"
          />
          <Label
            htmlFor="variable"
            className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-full
              ${productType === 'variable' ? 'border-primary' : ''}
            `}
          >
            <Packages className="h-12 w-12 mb-3" />
            <CardTitle className="text-lg">Variable Product</CardTitle>
            <CardDescription className="text-center mt-2">
              A product with multiple variations, each with its own price, SKU, and inventory
            </CardDescription>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}