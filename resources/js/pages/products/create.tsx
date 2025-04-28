import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';

import ProductTypeSelector from './components/ProductTypeSelector';
import BasicInfo from './components/BasicInfo';
import ProductDetails from './components/ProductDetails';
import PricingInventory from './components/PricingInventory';
import AttributesVariations from './components/AttributesVariations';
import ProductReview from './components/ProductReview';

const steps = [
  'type',
  'basic',
  'details',
  'pricing',
  'variations',
  'review'
];

export default function ProductCreate({ categories, attributes }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [productType, setProductType] = useState('simple');
  const [productData, setProductData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category_id: '',
    price: '',
    sale_price: '',
    sku: '',
    stock_quantity: '',
    featured_image: null,
    gallery_images: [],
    is_variable: false,
    attributes: [],
    variations: []
  });

  const updateProductData = (data) => {
    setProductData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    router.post(route('products.store'), {
      ...productData,
      is_variable: productType === 'variable'
    });
  };

  const renderStepContent = () => {
    switch (steps[currentStep]) {
      case 'type':
        return (
          <ProductTypeSelector 
            productType={productType} 
            setProductType={setProductType} 
          />
        );
      case 'basic':
        return (
          <BasicInfo 
            productData={productData} 
            updateProductData={updateProductData}
            categories={categories}
          />
        );
      case 'details':
        return (
          <ProductDetails 
            productData={productData} 
            updateProductData={updateProductData}
          />
        );
      case 'pricing':
        return (
          <PricingInventory 
            productData={productData} 
            updateProductData={updateProductData}
          />
        );
      case 'variations':
        return (
          <AttributesVariations 
            productData={productData} 
            updateProductData={updateProductData}
            attributes={attributes}
            productType={productType}
          />
        );
      case 'review':
        return (
          <ProductReview 
            productData={productData} 
            productType={productType}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {productType === 'simple' ? 'Create Simple Product' : 'Create Variable Product'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <Tabs value={steps[currentStep]} className="w-full">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger 
                  value="type"
                  disabled
                  className={currentStep >= 0 ? "text-primary" : ""}
                >
                  Type
                </TabsTrigger>
                <TabsTrigger 
                  value="basic"
                  disabled
                  className={currentStep >= 1 ? "text-primary" : ""}
                >
                  Basic Info
                </TabsTrigger>
                <TabsTrigger 
                  value="details"
                  disabled
                  className={currentStep >= 2 ? "text-primary" : ""}
                >
                  Details
                </TabsTrigger>
                <TabsTrigger 
                  value="pricing"
                  disabled
                  className={currentStep >= 3 ? "text-primary" : ""}
                >
                  Pricing
                </TabsTrigger>
                <TabsTrigger 
                  value="variations"
                  disabled
                  className={currentStep >= 4 ? "text-primary" : ""}
                >
                  {productType === 'simple' ? 'Attributes' : 'Variations'}
                </TabsTrigger>
                <TabsTrigger 
                  value="review"
                  disabled
                  className={currentStep >= 5 ? "text-primary" : ""}
                >
                  Review
                </TabsTrigger>
              </TabsList>

              <TabsContent value={steps[currentStep]} className="mt-6">
                {renderStepContent()}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" /> Create Product
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}